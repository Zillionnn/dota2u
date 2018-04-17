const  express = require('express');
const  router = express.Router();
const  request=require('request');
const fs=require('fs');
const log=require('log4js').getLogger("player");

const  MatchHistoryModel=require('../model/MatchHistoryModel');
const  AccountMatchHistoryModel=require('../model/AccountMatchHistoryModel');
const  UserInfoModel=require('../model/UserInfo');
const MatchDetailModel=require('../model/MatchDetailModel');


const  dota2constant=require('dotaconstants');
const  async=require('async');
const dota2Client=require('../steam_dota2_client/dota2Client');

let CONFIG=require('../config/config');



/**
 *
 * GET RECENT 20 MATCHES;
 * */
router.post('/getRecentMatchesByAccount', function(req, res, next) {
   console.log("getRecentMatchesByAccount");
    let account=req.body.account;
    getPlayerRecentMatchHistory(account,function (data) {
        //log.info(data);
        res.send(data);
    });
    
});

/**
 * API 查询玩家基本信息
 *
 * */
router.post('/getUserInfoByAccount',function (req, res, next) {
    log.info(req.body);
    log.info("process===",process.pid);
    let account_id=req.body.account;
    getUserInfo(account_id,function (data) {
        console.log(data);
        res.send(data);
    });
});

/***
 * 通过steam web api 查询玩家信息；
 */
router.post('/fetchUserInfoByAccount',function (req, res, next) {
    log.info(req.body);
    log.info("process===",process.pid);
    let rank_tier,
        leaderboard_rank,
        account_id=req.body.account;

    getPlayerProfile(account_id,function (data) {
        rank_tier=data.rank_tier.toString();
        leaderboard_rank=data.leaderboard_rank;
        fetchUserInfo(account_id,function (data) {
            let profile=data;
            profile.rank_tier=rank_tier;
            profile.leaderboard_rank=leaderboard_rank;
            console.log("profile>>>",profile);
            res.send(profile);
        });
    });

});

/**
 * 取得一场比赛的详细信息；
 */
router.get('/getonematchdetail/:match_id',function (req, res, next) {
    log.info("match_id>>",req.params.match_id);
    let match_id=req.params.match_id;
//    dota2Client.requestMatchDetails(match_id);
    matchDetailModel.selectByMatchId([match_id],function (data) {
        log.info("matchDetailsModel>>\n",data);
        res.json(data.rows);
    })
});


/**
 * 同步玩家的记录
 * ====================（线程）？
 */
router.post('/SynchronousPlayerData',function (req, res, next) {
    log.info(req.body);
    let account_id=req.body.account;
    //res.json({"info":"同步中..."});
    SynchronousPlayerMatches(account_id,function (data) {
        console.log(data);
        res.json(data);
    });
    
});


/**
 * ============================================================
 * */
var  userSummeries='http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key='+CONFIG.key;
var RecentlyPlayedGames='http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1?key='+CONFIG.key+'&steamid=76561198081585830';
let getMatchHistoryURL='http://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1?key='+CONFIG.key;
let getMatchDetail='http://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1?key='+CONFIG.key+'&match_id=';

var matchhistory=new MatchHistoryModel();
//var accountMatchHistoryModel=new AccountMatchHistoryModel();
var userInfoModel=new UserInfoModel();
let matchDetailModel=new MatchDetailModel();

let params=[123456,123456,818,0,0,7,'[{"id":1,"name":"jack"},{"id":2,"name":"bob"}]'];


/**
 * 通过account_id查询玩家信息；
 * @param account_id
 * @param callback
 */
function getUserInfo(account_id, callback) {
    userInfoModel.selectByAccountID([account_id], function (data) {

        if (data.rowCount > 0) {
            console.log("exist player");
            callback(data.rows[0]);
        } else {
            fetchUserInfo(account_id, function (data) {
                console.log("getUserInfo >>", data);
                callback(data);
            });
        }

    });

}


/**
 * steam web api 查询用户信息
 * @param account_id
 * @param callback
 */
function fetchUserInfo(account_id,callback) {
    
    let steamID=dota2Client.ToSteamID(account_id);
    console.log("steam id ==",steamID);
    let new_url=userSummeries+'&steamids='+steamID;
    console.log(new_url);
    request(new_url,function (err, data) {
        if(err){
            throw log.error(err);
        }else{
            try{
                let result=JSON.parse(data.body).response.players[0];
                // log.info(result);
                let sql_params=[];
                result.steamid=parseInt(result.steamid);
                sql_params.push(result.steamid);
                sql_params.push(result.communityvisibilitystate);
                sql_params.push(result.profilestate);
                sql_params.push(result.personaname);
                sql_params.push(result.lastlogoff);
                sql_params.push(result.commentpermission);
                sql_params.push(result.profileurl);
                sql_params.push(result.avatar);
                sql_params.push(result.avatarmedium);
                sql_params.push(result.avatarfull);
                sql_params.push(result.personastate);
                sql_params.push(result.realname);
                sql_params.push(result.primaryclanid);
                sql_params.push(result.timecreated);
                sql_params.push(result.personastateflags);
                sql_params.push(result.loccountrycode);
                sql_params.push(account_id);
                log.info(sql_params);
                userInfoModel.selectBySteamId([result.steamid],function (data) {
                    if(data.rowCount>0){
                        log.info('>>user exist，update user');
                        sql_params.push(result.steamid);
                        userInfoModel.update(sql_params,function (data) {
                            log.info(data);
                        });
                        callback(result);

                    }else{
                        userInfoModel.insert(sql_params,function (data) {
                            if(data.rowCount>=1){
                                log.info("insert user info SUCCESS");
                            };
                            callback(result);
                        });
                    }
                });

            }catch (e) {
                log.error("ERROR>>>>\n",e);
                callback(e);
            }

        }
    });
}



/***
 * 同步所有比赛--
 * 获取玩家比赛记录
 * account_id
 * start_at_match_id
 * hero_id
 * callback
 *
 * */
function getAccountMatchHistorySeries(account_id,start_at_match_id,hero_id,callback) {
    console.log('hero id==============',hero_id);
    console.log('getAccountMatchHistorySeries');
    let url=getMatchHistoryURL+'&matches_requested='+250+'&min_players='+2;
    let new_url=url+'&account_id='+account_id;
    if(hero_id && start_at_match_id){
        new_url=url+'&account_id='+account_id+'&hero_id='+hero_id+'&start_at_match_id='+start_at_match_id;
    }
    if (hero_id){
        new_url=url+'&account_id='+account_id+'&hero_id='+hero_id;
    }

    if(start_at_match_id){
        new_url=new_url+'&start_at_match_id='+start_at_match_id;
    }
    console.log(new_url);
    request(new_url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            //  //logger.info(data.body);
            try{
                var matches=JSON.parse(data.body).result.matches;
                //  log.info(matches);

                async.series([
                    function (series_callback) {
                        async.eachSeries(matches,function (match, callback_c) {
                            console.log("in series>");
                            matchDetailModel.selectByMatchId([match.match_id],function (data) {
                                // log.info("select by id",data.rowCount);
                                if(data.rowCount<=0){
                                    insertMatchDetails(match.match_id, callback_c);
                                }else{
                                  callback_c();
                                }
                            });

                        },function (err) {
                            if(err){
                                console.error(err);
                                log.error("IN getAccountMatchHistorySeries async error ERROR>>",err);
                            }else{
                                console.log("all finished ?");
                                series_callback();
                            }
                        });

                    },
                    //接上一步做完；
                    function (series_callback) {
                        if(matches[249]){
                            console.log("has the next 10 matches");
                            let lastID=matches[9].match_id-1;
                            getAccountMatchHistorySeries(account_id,lastID,hero_id,callback);

                        }else {
                            //下一个英雄
                            console.log('next hero >');
                            series_callback();
                            callback();
                        }

                    }
                ]);

            }catch (e){
             console.error(e);
                log.error("getAccountMatchHistorySeries>>",e);
                log.error("getAccountMatchHistorySeries body>>",data.body);
            }

        }
    });
}

/**
 * 更新玩家最近比赛记录；
 * 获取最近500场比赛
 * @param account_id
 * @param start_at_match_id
 * @param hero_id
 */
function updateAccount500MatchHistory(account_id,start_at_match_id,hero_id,callback_main) {
    //let update_over=false;
    console.log('====get player recent 500 matches=====\n');
    let url=getMatchHistoryURL+'&matches_requested='+10+'&min_players='+2;
    let new_url=url+'&account_id='+account_id;
    if(hero_id && start_at_match_id){
        new_url=url+'&account_id='+account_id+'&hero_id='+hero_id+'&start_at_match_id='+start_at_match_id;
    }
    if (hero_id){
        new_url=url+'&account_id='+account_id+'&hero_id='+hero_id;
    }

    if(start_at_match_id){
        new_url=new_url+'&start_at_match_id='+start_at_match_id;
    }
    log.info(new_url);
    request(new_url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            //  //logger.info(data.body);
            var matches=JSON.parse(data.body).result.matches;
            let result_remianing=JSON.parse(data.body).result.result_remaining;
            //  log.info(matches);

            async.series([
                function (series_callback) {
                    async.eachSeries(matches,function (match, callback_c) {
                        console.log("in series>");
                        let match_param=[];
                        match_param.push(account_id);
                        match_param.push(match.match_id);
                        match_param.push(match.match_seq_num);
                        match_param.push(match.start_time);
                        match_param.push(match.lobby_type);
                        match_param.push(match.radiant_team_id);
                        match_param.push(match.dire_team_id);
                        match_param.push(JSON.stringify(match.players));
                        //  log.info(match_param);

                     //   let rowcount_match_id;
                        matchDetailModel.selectByMatchId([match.match_id],function (data) {
                            if(data.rowCount<=0){
                                insertMatchDetails(match.match_id, callback_c);
                            }else{
                               // update_over=true;
                                console.log("series callback()");
                                series_callback();
                            }
                        });
                    },function (err) {
                        console.error(err);
                      //  log.error("IN getAccountMatchHistorySeries async error ERROR>>",err);
                        console.log("all finished ?");
                        series_callback();
                    });

                },
                //接上一步做完；
                function (series_callback) {
                    console.log("update_over>>",update_over);
                    if(result_remianing>450){
                        if(matches[9]){
                            console.log("has the next 10 matches");
                            let lastID=matches[9].match_id-1;
                            updateAccount500MatchHistory(account_id,lastID,null,callback_main);
                        }
                    }else{
                        console.log('update player RECENT matches OVER>>');
                        selectPlayerLatest20Match(account_id,function (data) {
                            //更新同步情况
                            userInfoModel.updatePlayerSynchron([true,account_id],function (data) {
                                console.log("UPDATE USER SYNCRHON>>",data);
                            });
                            log.info(data.rows[0]);
                            let matches=[];
                            for(let i in data.rows){
                                matches.push(data.rows[i]);
                            }
                            //返回结果
                            callback_main(matches);
                        });
                    }

                   // series_callback();
                }
            ]);


        }
    });
}

/**
 * 取最近20场比赛
 * @param account_id
 * @param callback
 */
function getPlayerRecentMatchHistory(account_id, callback) {
    let recentURL=getMatchHistoryURL+'&matches_requested='+1+'&min_players='+2;
    let new_url=recentURL+'&account_id='+account_id;
    console.log(new_url);
    console.log("get player recent match history>>");

    request(new_url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            //  //logger.info(data.body);
            try{

                let result=JSON.parse(data.body).result;
               log.info(result);
                if(result.status!=1){
                    callback({error:403});
                    return;
                }
                let matches=result.matches;

                if(matches){
                    let latest_match_id=matches[0].match_id;
                    console.log("lasted_match_id",latest_match_id);
                    
                    //match_id 可以重复   match_detail 表里的不可以重复
               //     accountMatchHistoryModel.selectByMatchId([lastest_match_id],function (data) {
                    selectPlayerLatest20Match(account_id,function (data) {
                     //  console.log("===================================data.>",data);
                        //最新的记录不足20场，或者，最新match_id不匹配

                        if(data.rowCount<20 || data.rows[0].match_id!=latest_match_id){
                            console.warn("THE ACCOUNT NEED TO UPDATE DATA");
                            //更新玩家比赛记录
                            updatePlayerMatchHistory(account_id,callback);

                        }else{
                            //取最近20场比赛
                              //  console.log(data.rows[0]);
                                let matches=[];
                                for(let i in data.rows){
                                    matches.push(data.rows[i]);
                                }
                                callback(matches);

                        }
                    });
                    //   callback(matches);
                }
            }catch (e){
                log.error(e);
            }

        }
    });

}

/**
 *
 *
 * 更新玩家所有比赛记录
 *
 * */
function updatePlayerMatchHistory(account_id,callback) {
    console.log("IN  updatePlayerMatchHistory");
    //查询表中有多少条元素包含该account_id
    //小于20条，就更新比赛
    //查询该玩家是否同步数据？
    userInfoModel.selectPlayerISSyn([account_id],function (data) {

        let synchron=data.rows[0].synchron;
        console.log("synchron>>",synchron);
        if(synchron==true){
            console.log(synchron);
            //按时间顺序获取记录；
            updateAccount500MatchHistory(account_id,null,null,callback);
        }else{
            console.log(synchron);
            //==========更新用户所有比赛=========
            console.log('=更新用户所有比赛==');
            async.eachSeries(dota2constant.heroes,function (item,callback) {
                getAccountMatchHistorySeries(account_id,"",item.id,callback);
            },function (err) {
                if(err){
                    log.error("updatePlayerMatchHistory   ==>    async.eachSeries>>   ",err);
                }
                // callback({"result":"success"});
                //更新同步情况
                userInfoModel.updatePlayerSynchron([true,account_id],function (data) {
                    console.log("UPDATE USER SYNCRHON>>",data);
                });

                getPlayerRecentMatchHistory(account_id,function (data) {
                    callback(data);
                })
            });
        }
    });
   /* matchDetailModel.selectIDsByContainAccount([account_id],function (data) {
        console.log(data);
        if(data.rowCount>0){
            console.log(data.rowCount);
            //按时间顺序获取记录；
            updateAccount500MatchHistory(account_id,null,null,callback);

        }else if(data.rowCount==0){
            //==========更新用户所有比赛=========
            console.log('=更新用户所有比赛==');
            async.eachSeries(dota2constant.heroes,function (item,callback) {
                getAccountMatchHistorySeries(account_id,"",item.id,callback);
            },function (err) {
                if(err){
                    log.error("updatePlayerMatchHistory   ==>    async.eachSeries>>   ",err);
                }
               // callback({"result":"success"});
                getPlayerRecentMatchHistory(account_id,function (data) {
                    callback(data);
                })
            });

        }
    });*/

}

function selectPlayerLatest20Match(account_id,callback) {
    matchDetailModel.selectRecentByContainAccountIDLimit20([account_id],function (data) {
        let matches=data.rows;
        //没办法，查询20个，写到数据库
        for(var i in matches){
            insertMatchDetailsWithoutCallback(matches[i].match_id);
        }
        callback(data);
    })
}

function insertAccountMatchHistory100(account_id,start_at_match_id,hero_id) {
    let new_url=url+'&account_id='+account_id;
    if(hero_id && start_at_match_id){
        new_url=url+'&account_id='+account_id+'&hero_id='+hero_id+'&start_at_match_id='+start_at_match_id;
    }
    if (hero_id){
        new_url=url+'&account_id='+account_id+'&hero_id='+hero_id;
    }

    if(start_at_match_id){
        new_url=new_url+'&start_at_match_id='+start_at_match_id;
    }
    log.info(new_url);
    request(new_url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            //  //logger.info(data.body);
            var matches=JSON.parse(data.body).result.matches;
            log.info(matches.length);
            async.eachSeries(matches,function (item, callback) {
                let match_param=[];
                match_param.push(account_id);
                match_param.push(item.match_id);
                match_param.push(item.match_seq_num);
                match_param.push(item.start_time);
                match_param.push(item.lobby_type);
                match_param.push(item.radiant_team_id);
                match_param.push(item.dire_team_id);
                match_param.push(JSON.stringify(item.players));
                //  log.info(match_param);

                let rowcount_match_id;
                accountMatchHistoryModel.selectByMatchId([item.match_id],function (data ) {
                    log.info("data row count>>",data.rowCount);
                    rowcount_match_id=data.rowCount;
                    if(rowcount_match_id<=0){
                        accountMatchHistoryModel.insert(match_param,function (data) {
                            log.info(data);
                            if(data.rowCount>0){
                                insertMatchDetails(item.match_id,callback);
                            }
                        });
                    }
                });


            });




        }
    });
}





//========================================
// 串行执行：最近查询的账号百场比赛，处理百场数据
let onehundred=false;
if(onehundred){
    async.waterfall([
        function (callback) {
            get100LastestAccountMatchIds(121320102,callback)
        },
        function (arg1, callback) {

            doOneHundred(arg1,callback);
        }
    ],function (err, result) {
        if(err){
            log.info(err);
        }
        log.info(result);
    });
}
function doOneHundred(dataArray,callback){

    let sumKills=0,
        sumDeaths=0,
        sumAssists=0,
        sumLastHits=0,
        sumDenies=0,
        sumGoldPerMin=0,
        sumXp=0,
        sumHeroDamage=0,
        sumTowerDamage=0,
        sumScaledHeroDamage=0,
        sumScaledTowerDamage=0,
        sumScaledHeroHealing=0  ;


    for(let  i in dataArray){
        //   log.info(i);
        sumKills+=dataArray[i].kills;
        sumDeaths+=dataArray[i].deaths;
        sumAssists+=dataArray[i].assists;
        sumLastHits+=dataArray[i].last_hits;
        sumDenies+=dataArray[i].denies;
        sumGoldPerMin+=dataArray[i].gold_per_min;
        sumXp+=dataArray[i].xp_per_min;
        sumHeroDamage+=dataArray[i].hero_damage;
        sumTowerDamage+=dataArray[i].tower_damage;
        sumScaledHeroDamage+=dataArray[i].scaled_hero_damage;

        sumScaledTowerDamage+=dataArray[i].scaled_tower_damage;

        sumScaledHeroHealing+=dataArray[i].scaled_hero_healing;

    }
    let avgKills=sumKills/100;
    let avgDeaths=sumDeaths/100;
    let avgAssists=sumAssists/100;
    let avgDenies=sumDenies/100;
    let avgSumLastHits=sumLastHits/100;
    let avgHeroDamage=sumHeroDamage/100;
    let avgScaledHeroDamange=sumScaledHeroDamage/100;
    let avgScaledHeroHealing=sumScaledHeroHealing/100;
    let avgScaledTowerDamage=sumScaledTowerDamage/100;
    let avgSumXp=sumXp/100;

    let avgGoldPerMin=sumGoldPerMin/100;
    log.info(avgKills,avgDeaths);
    let result={
        avgKills:avgKills,
        avgDeaths:avgDeaths,
        avgAssists:avgAssists,
        avgDenies:avgDenies,
        avgSumLastHits:avgSumLastHits,
        avgHeroDamage:avgHeroDamage,
        avgScaledHeroDamange:avgScaledHeroDamange,
        avgScaledHeroHealing:avgScaledHeroHealing,
        avgScaledTowerDamage:avgScaledTowerDamage,
        avgSumXp:avgSumXp,
        avgGoldPerMin:avgGoldPerMin
    }
    callback(null, result);

}
function get100LastestAccountMatchIds (account_id,callback) {
    accountMatchHistoryModel.selectAccount100([account_id],function (data ) {
        //  log.info( data.rows[0].match_id);
        let dataArray=[];
        async.eachSeries(data.rows,function (item, done) {
            let matchId=parseInt(item.match_id);
            log.info(item);
            getPlayerMatchData(account_id,matchId,done,function (data) {
                //    log.info(data);
                dataArray.push(data);
            });
            //log.info(dataArray);
            if(item==data.rows[99]){
                callback(null,dataArray);
            }
        });

    });
}
function getPlayerMatchData(account_id,match_id,done,callback) {
    let playerData={
        kills:0,
        deaths:0,
        assists:0,
        last_hits:0,
        denies:0,
        gold_per_min:0,
        xp_per_min:0,
        hero_damage:0,
        tower_damage:0,
        scaled_hero_damage:0,
        scaled_tower_damage:0,
        scaled_hero_healing:0
    };
    let url=getMatchDetail+match_id;
    //log.info(url);
    request(url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            //  log.info(data.body);
            let result=JSON.parse(data.body).result;
            let players=result.players;
            for(var i in players){
                if(account_id==players[i].account_id){
                    //log.info(players[i]);
                    playerData.kills=players[i].kills;
                    playerData.deaths=players[i].deaths;
                    playerData.assists=players[i].assists;
                    playerData.last_hits=players[i].last_hits;
                    playerData.denies=players[i].denies;
                    playerData.gold_per_min=players[i].gold_per_min;
                    playerData.xp_per_min=players[i].xp_per_min;
                    playerData.hero_damage=players[i].hero_damage;
                    playerData.tower_damage=players[i].tower_damage;
                    playerData.scaled_hero_damage=players[i].scaled_hero_damage;
                    playerData.scaled_tower_damage=players[i].scaled_tower_damage;
                    playerData.scaled_hero_healing=players[i].scaled_hero_healing;
                    callback(playerData);
                    done();
                }
            }
        }

    });
}


/**
 * 写入比赛详细；callback
 * @param match_id
 * @param callback
 */

function insertMatchDetails(match_id,callback) {
    console.log("insertMatchDetails>>");
    matchDetailModel.selectByMatchId([match_id],function (data) {
        if(data.rowCount==0){

            let url=getMatchDetail+match_id;
            log.info(url);
            request(url,function (err,data) {
                if(err){
                    //logger.info(err);
                }else{
                    //  log.info(data.body);
                    try{
                        let result=JSON.parse(data.body).result;
                        //log.info(result);
                        let sql_pararms=[];
                        let player_accounts=[];
                        for(var i in result.players){
                            player_accounts.push(result.players[i].account_id);
                        }
                        sql_pararms.push(result.match_id);
                        sql_pararms.push(result.match_seq_num);
                        sql_pararms.push(result.radiant_win);
                        sql_pararms.push(result.duration);
                        sql_pararms.push(result.start_time);
                        sql_pararms.push(result.tower_status_radiant);
                        sql_pararms.push(result.tower_status_dire);
                        sql_pararms.push(result.barracks_status_radiant);
                        sql_pararms.push(result.barracks_status_dire);
                        sql_pararms.push(result.cluster);
                        sql_pararms.push(result.first_blood_time);
                        sql_pararms.push(result.lobby_type);
                        sql_pararms.push(result.human_players);
                        sql_pararms.push(result.leagueid);
                        sql_pararms.push(result.positive_votes);
                        sql_pararms.push(result.negative_votes);
                        sql_pararms.push(result.game_mode);
                        sql_pararms.push(result.flags);
                        sql_pararms.push(result.engine);
                        sql_pararms.push(result.radiant_score);
                        sql_pararms.push(result.dire_score);
                        sql_pararms.push(result.tournament_id);
                        sql_pararms.push(result.tournament_round);
                        sql_pararms.push(result.radiant_team_id);
                        sql_pararms.push(result.radiant_name);
                        sql_pararms.push(result.radiant_logo);
                        sql_pararms.push(result.radiant_team_complete);
                        sql_pararms.push(result.dire_team_id);
                        sql_pararms.push(result.dire_name);
                        sql_pararms.push(result.dire_logo);
                        sql_pararms.push(result.dire_team_complete);
                        sql_pararms.push(result.radiant_captain);
                        sql_pararms.push(result.dire_captain);
                        sql_pararms.push(JSON.stringify(player_accounts));
                        sql_pararms.push(JSON.stringify(result.players));
                        sql_pararms.push(JSON.stringify(result.picks_bans));
                        matchDetailModel.insert(sql_pararms,function (data) {
                            console.log('insert a match detail');
                            callback();
                        });
                        
                    }catch (e){
                        console.error(e);
                        log.error("insertMatchDetails>>",e);
                        log.error("insertMatchDetails  BODY>>>\n",data.body);
                    }
                    
                }

            });

        }else{
            console.log('已存在match detail,  callback进入下一个');
            callback();
        }
    });


}

/**
 * 无回调插入比赛详细；
 * @param match_id
 */
function insertMatchDetailsWithoutCallback(match_id) {
    console.log('insertMatchDetailsWithoutCallback');
    matchDetailModel.selectByMatchId([match_id],function (data) {
        if(data.rowCount==0){

            let url=getMatchDetail+match_id;

            request(url,function (err,data) {
                if(err){
                    //logger.info(err);
                }else{
                    //  log.info(data.body);
                    try{
                        console.log(url);

                        let result=JSON.parse(data.body).result;
                        //log.info(result);
                        let sql_pararms=[];
                        let player_accounts=[];
                        for(var i in result.players){
                            player_accounts.push(result.players[i].account_id);
                        }
                        sql_pararms.push(result.match_id);
                        sql_pararms.push(result.match_seq_num);
                        sql_pararms.push(result.radiant_win);
                        sql_pararms.push(result.duration);
                        sql_pararms.push(result.start_time);
                        sql_pararms.push(result.tower_status_radiant);
                        sql_pararms.push(result.tower_status_dire);
                        sql_pararms.push(result.barracks_status_radiant);
                        sql_pararms.push(result.barracks_status_dire);
                        sql_pararms.push(result.cluster);
                        sql_pararms.push(result.first_blood_time);
                        sql_pararms.push(result.lobby_type);
                        sql_pararms.push(result.human_players);
                        sql_pararms.push(result.leagueid);
                        sql_pararms.push(result.positive_votes);
                        sql_pararms.push(result.negative_votes);
                        sql_pararms.push(result.game_mode);
                        sql_pararms.push(result.flags);
                        sql_pararms.push(result.engine);
                        sql_pararms.push(result.radiant_score);
                        sql_pararms.push(result.dire_score);
                        sql_pararms.push(result.tournament_id);
                        sql_pararms.push(result.tournament_round);
                        sql_pararms.push(result.radiant_team_id);
                        sql_pararms.push(result.radiant_name);
                        sql_pararms.push(result.radiant_logo);
                        sql_pararms.push(result.radiant_team_complete);
                        sql_pararms.push(result.dire_team_id);
                        sql_pararms.push(result.dire_name);
                        sql_pararms.push(result.dire_logo);
                        sql_pararms.push(result.dire_team_complete);
                        sql_pararms.push(result.radiant_captain);
                        sql_pararms.push(result.dire_captain);
                        sql_pararms.push(JSON.stringify(player_accounts));
                        sql_pararms.push(JSON.stringify(result.players));
                        sql_pararms.push(JSON.stringify(result.picks_bans));
                        matchDetailModel.insert(sql_pararms,function (data) {
                            console.log("===INSERT MATCH DETAIL SUCCESS===\n");
                        })

                    }catch (e){
                        console.error(e);
                        console.log(data.body);
                        log.error("insertMatchDetailsWithoutCallback>>",e);
                        log.error('data body >>',data.body);
                    }

                }
            });

        }
    });

}


/**
 * 同步玩家比赛数据，所有比赛
 * @param account_id
 * @constructor
 */
function SynchronousPlayerMatches(account_id,callback){
    async.eachSeries(dota2constant.heroes,function (item,callback) {
        getAccountMatchHistorySeries(account_id,"",item.id,callback);
    },function (err) {
        if(err){
            log.error("updatePlayerMatchHistory   ==>    async.eachSeries>>   ",err);
        }
        // callback({"result":"success"});
        //更新同步情况
        userInfoModel.updatePlayerSynchron([true,account_id],function (data) {
            console.log("UPDATE USER SYNCRHON>>",data);
        });
        callback({"result":"同步成功"});
    });
}

/**
 * GC  获取玩家资料卡
 * @param account_id
 */
function getPlayerProfile(account_id,callback) {
    dota2Client.requestProfileCard(account_id,function (data) {
        console.log("PLAYER PROFILE CARD>>",data);
        callback(data);
    })
    
}
module.exports = router;
