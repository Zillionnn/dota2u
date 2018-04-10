const  express = require('express');
const  router = express.Router();
const  request=require('request');

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
 * GET users listing.
 * */
router.post('/getRecentMatchesByAccount', function(req, res, next) {
    console.log(req.body);
    let account=req.body.account;
    getPlayerRecentMatchHistory(account,function (data) {
        //console.log(data);
        res.send(data);
    });
    
});

/**
 * API 查询玩家基本信息
 * */
router.post('/getUserInfoByAccount',function (req, res, next) {
    console.log(req.body);
    let account_id=req.body.account;
    getUserInfo(account_id,function (data) {
        res.send(data);
    });
});


/**
 * 取得一场比赛的详细信息；
 */
router.get('/getonematchdetail/:match_id',function (req, res, next) {
    console.log("match_id>>",req.params.match_id);
    let match_id=req.params.match_id;
    matchDetailModel.selectByMatchId([match_id],function (data) {
        console.log("matchDetailsModel>>\n",data);
        res.json(data.rows);
    })
});


/**
 * ============================================================
 * */
var  userSummeries='http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key='+CONFIG.key;
var RecentlyPlayedGames='http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1?key='+CONFIG.key+'&steamid=76561198081585830';
let getMatchHistoryURL='http://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1?key='+CONFIG.key;
let getMatchDetail='http://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1?key='+CONFIG.key+'&match_id=';

var matchhistory=new MatchHistoryModel();
var accountMatchHistoryModel=new AccountMatchHistoryModel();
var userInfoModel=new UserInfoModel();
let matchDetailModel=new MatchDetailModel();

let params=[123456,123456,818,0,0,7,'[{"id":1,"name":"jack"},{"id":2,"name":"bob"}]'];


//=======通过account_id查询玩家信息========?????????==

function getUserInfo(account_id,callback) {
    fetchUserInfo(account_id,function (data) {
        console.log("getUserInfo >>",data);
        callback(data);
    });
    }



//==========fetch user steam info=================
function fetchUserInfo(account_id,callback) {
    console.log(userSummeries);
    let steamID=dota2Client.ToSteamID(account_id);
    console.log("steam id ==",steamID);
    let new_url=userSummeries+'&steamids='+steamID;
    console.log(new_url);
    request(new_url,function (err, data) {
        if(err){
            throw console.error(err);
        }else{
            try{
                let result=JSON.parse(data.body).response.players[0];
                // console.log(result);
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
                console.log(sql_params);
                userInfoModel.selectBySteamId([result.steamid],function (data) {
                    if(data.rowCount>0){
                        console.log('>>user exist');
                        sql_params.push(result.steamid);
                        userInfoModel.update(sql_params,function (data) {
                            console.log(data);
                        });

                    }else{
                        userInfoModel.insert(sql_params,function (data) {
                            if(data.rowCount>=1){
                                console.log("insert user info SUCCESS");
                            };
                        });
                    }
                });

                userInfoModel.selectByAccountID([account_id],function (data) {
                    console.log("select by account id ===============>.",data.rows[0]);
                    callback(data.rows[0]);
                });

            }catch (e) {
                console.error("ERROR>>>>\n",e);
                callback(e);
            }

        }
    });
}



//=======100场=====match history================
//============match history====当前 最新500场============
let url=getMatchHistoryURL+'&matches_requested='+10+'&min_players='+2;
//getMatchHistory();
function getMatchHistory(start_match_id) {
    console.log(start_match_id);
    let  new_url=url;
    if(start_match_id){
        new_url=new_url+'&start_at_match_id='+start_match_id;
    }
    console.log(new_url);

    request(new_url,function (err, data) {
        if(err){
            //logger.info(err);
        }else{
            //  //logger.info(data.body);
            var matches=JSON.parse(data.body).result.matches;

            //
            async.eachSeries(matches,function (match, callback) {

                let match_param=[];
                match_param.push(match.match_id);
                match_param.push(match.match_seq_num);
                match_param.push(match.start_time);
                match_param.push(match.lobby_type);
                match_param.push(match.radiant_team_id);
                match_param.push(match.dire_team_id);
                match_param.push(JSON.stringify(match.players));
                //  console.log(match_param);
                let rowcount_match_id;
                matchhistory.selectByMatchId([match.match_id],function (data ) {
                    //    console.log("select by id",data.rowCount);
                    rowcount_match_id=data.rowCount;
                    if(rowcount_match_id<=0){
                        matchhistory.insert(match_param,function (data) {
                            console.log(data);
                            //插入成功，查找match detail并写入数据库
                            if(data.rowCount>0){
                                insertMatchDetails(match.match_id,callback);

                            }

                        });
                    }
                });

            });



            console.log(matches[9]);
            if(matches[9]){
                let lastID=matches[9].match_id-1;
                getMatchHistory(lastID);
            }else{
                setTimeout(function () {
                    getMatchHistory();
                },60000);
            }



        }
    });
}



//console.log(dota2constant.heroes[1]);


//insertAccountMatchHistory100(121320102);


/***
 * 获取玩家比赛记录
 * account_id
 * start_at_match_id
 * hero_id
 * callback
 *
 * */
function getAccountMatchHistorySeries(account_id,start_at_match_id,hero_id,callback) {
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
    console.log(new_url);
    request(new_url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            //  //logger.info(data.body);
            var matches=JSON.parse(data.body).result.matches;
            //  console.log(matches);
            for(var i in matches){
                let match_param=[];
                match_param.push(account_id);
                match_param.push(matches[i].match_id);
                match_param.push(matches[i].match_seq_num);
                match_param.push(matches[i].start_time);
                match_param.push(matches[i].lobby_type);
                match_param.push(matches[i].radiant_team_id);
                match_param.push(matches[i].dire_team_id);
                match_param.push(JSON.stringify(matches[i].players));
                //  console.log(match_param);

                let rowcount_match_id;
                accountMatchHistoryModel.selectByMatchId([matches[i].match_id],function (data ) {
                    //    console.log("select by id",data.rowCount);
                    rowcount_match_id=data.rowCount;
                    if(rowcount_match_id<=0){
                        accountMatchHistoryModel.insert(match_param,function (data) {
                            console.log(data);
                        });
                    }
                });

            }

            if(matches[9]){
                let lastID=matches[9].match_id-1;
                getAccountMatchHistorySeries(account_id,lastID,hero_id,callback);

            }else {
                callback();
            }

        }
    });
}

function getAccountMatchHistory(account_id,start_at_match_id,hero_id) {
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
    console.log(new_url);
    request(new_url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            //  //logger.info(data.body);
            var matches=JSON.parse(data.body).result.matches;
            //  console.log(matches);
            for(var i in matches){
                let match_param=[];
                match_param.push(account_id);
                match_param.push(matches[i].match_id);
                match_param.push(matches[i].match_seq_num);
                match_param.push(matches[i].start_time);
                match_param.push(matches[i].lobby_type);
                match_param.push(matches[i].radiant_team_id);
                match_param.push(matches[i].dire_team_id);
                match_param.push(JSON.stringify(matches[i].players));
                //  console.log(match_param);

                let rowcount_match_id;
                accountMatchHistoryModel.selectByMatchId([matches[i].match_id],function (data ) {
                    //    console.log("select by id",data.rowCount);
                    rowcount_match_id=data.rowCount;
                    if(rowcount_match_id<=0){
                        accountMatchHistoryModel.insert(match_param,function (data) {
                            console.log(data);
                        });
                        insertMatchDetails(matches[i].match_id);
                    }else{
                        return;
                    }
                });

            }

            if(matches[9]){
                let lastID=matches[9].match_id-1;
                getAccountMatchHistory(account_id,lastID,hero_id);
            }

        }
    });
}

function getPlayerRecentMatchHistory(account_id, callback) {
    let recentURL=getMatchHistoryURL+'&matches_requested='+1+'&min_players='+2;
    let new_url=recentURL+'&account_id='+account_id;

    console.log(new_url);
    request(new_url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            //  //logger.info(data.body);
            let result=JSON.parse(data.body).result;
            console.log(result);
            if(result.status!=1){
                callback({error:403});
                return;
            }
            let matches=result.matches;

            if(matches){
                let lastest_match_id=matches[0].match_id;
                accountMatchHistoryModel.selectByMatchId([lastest_match_id],function (data) {
                    if(data.rowCount==0){
                        console.warn("THE ACCOUNT NEED TO UPDATE DATA");
                        //更新玩家比赛记录
                        updatePlayerMatchHistory(account_id);

                    }else if(data.rowCount==1){
                        let request_num=20;
                        selectPlayerMatch(account_id,request_num,function (data) {
                            console.log(data.rows[0]);
                            let matches=[];
                            for(let i in data.rows){
                                matches.push(data.rows[i]);
                            }
                            callback(matches);
                        });
                    }
                });
                //   callback(matches);
            }

        }
    });

/*    request(new_url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            //  //logger.info(data.body);
            var matches=JSON.parse(data.body).result.matches;
            //  console.log(matches);
            for(var i in matches){
                let match_param=[];
                match_param.push(account_id);
                match_param.push(matches[i].match_id);
                match_param.push(matches[i].match_seq_num);
                match_param.push(matches[i].start_time);
                match_param.push(matches[i].lobby_type);
                match_param.push(matches[i].radiant_team_id);
                match_param.push(matches[i].dire_team_id);
                match_param.push(JSON.stringify(matches[i].players));
                //  console.log(match_param);

                let rowcount_match_id;
                accountMatchHistoryModel.selectByMatchId([matches[i].match_id],function (data ) {
                    //    console.log("select by id",data.rowCount);
                    rowcount_match_id=data.rowCount;
                    if(rowcount_match_id<=0){
                        accountMatchHistoryModel.insert(match_param,function (data) {
                            console.log(data);
                        });
                    }
                });

            }
            callback(matches);
        }
    });*/
}

/**
 *
 *
 * 更新玩家所有比赛记录
 *
 * */
function updatePlayerMatchHistory(account_id) {
    accountMatchHistoryModel.selectByAccount([account_id],function (data) {
        if(data.rowCount>0){
            console.log(data.rowCount);
            //按时间顺序获取记录；
            getAccountMatchHistory(account_id);
        }else{
            //==========获取用户所有比赛=========
            async.eachSeries(dota2constant.heroes,function (item,callback) {
                getAccountMatchHistorySeries(account_id,"",item.id,callback);
            });
        }
    });

}

function selectPlayerMatch(account_id,request_num,callback) {
    let sql_params=[];
    sql_params.push(account_id);
    sql_params.push(request_num);
    accountMatchHistoryModel.selectByPlayerIdAndLimit(sql_params,function (data) {

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
    console.log(new_url);
    request(new_url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            //  //logger.info(data.body);
            var matches=JSON.parse(data.body).result.matches;
            console.log(matches.length);
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
                //  console.log(match_param);

                let rowcount_match_id;
                accountMatchHistoryModel.selectByMatchId([item.match_id],function (data ) {
                    console.log("data row count>>",data.rowCount);
                    rowcount_match_id=data.rowCount;
                    if(rowcount_match_id<=0){
                        accountMatchHistoryModel.insert(match_param,function (data) {
                            console.log(data);
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
            console.log(err);
        }
        console.log(result);
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
        //   console.log(i);
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
    console.log(avgKills,avgDeaths);
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
        //  console.log( data.rows[0].match_id);
        let dataArray=[];
        async.eachSeries(data.rows,function (item, done) {
            let matchId=parseInt(item.match_id);
            console.log(item);
            getPlayerMatchData(account_id,matchId,done,function (data) {
                //    console.log(data);
                dataArray.push(data);
            });
            //console.log(dataArray);
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
    //console.log(url);
    request(url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            //  console.log(data.body);
            let result=JSON.parse(data.body).result;
            let players=result.players;
            for(var i in players){
                if(account_id==players[i].account_id){
                    //console.log(players[i]);
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



//=================insert match details======================


function insertMatchDetails(match_id,callback) {
    let url=getMatchDetail+match_id;
    console.log(url);
    request(url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            console.log(data.body);
            let result=JSON.parse(data.body).result;
            //console.log(result);
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
            matchDetailModel.selectByMatchId([result.match_id],function (data) {
                if(data.rowCount==0){
                    matchDetailModel.insert(sql_pararms,function (data) {
                        console.log(data);
                        callback();
                    })
                }
            })


        }

    });
}


/*router.get('/userinfo',function (req, res, next) {
 ////logger.info("userinfo");
 request(userSummeries,function (err, data) {
 if(err){

 }else{
 //   //logger.info(data.body);
 res.send(data.body);
 }
 })
 });

 router.get('/userRecentlyPlayedGames',function (req, res, next) {
 //logger.info("userRecentlyPlayedGames");
 request(RecentlyPlayedGames,function (err, data) {
 if(err){
 //logger.info(err);
 }else{
 ////logger.info(data.body);
 res.send(data.body);
 }
 })
 });*/


//查询的匹配历史
router.post('/getMatchHistory',function (req, res, next) {
    //   ////logger.info("getMatchHistory>>");
    let hero_id=parseInt(req.body.hero_id);

    let    min_players=parseInt(req.body.min_players);
    let account_id=parseInt(req.body.account_id);
    let start_at_match_id=parseInt(req.body.start_at_match_id);

    let matches_requested=parseInt(req.body.matches_requested);
    let url=getMatchHistory+'&account_id='+account_id+'&hero_id='+hero_id+'&matches_requested='+matches_requested+'&min_players='+min_players+'&start_at_match_id='+start_at_match_id;
    //logger.info(req.body);
    //logger.warn("getMatchHistoryByHero url>>",url);
    request(url,function (err, data) {
        if(err){
            //logger.info(err);
        }else{
            //  //logger.info(data.body);
            res.send(data.body);
        }
    })
});



router.post('/getMatchDetail',function (req, res, next) {
    //logger.info("get match detail");
    //logger.info(req.body);
    let match_id=parseInt(req.body.match_id);
    let url=getMatchDetail+match_id;
    //logger.info(url);
    request(url,function (err,data) {
        if(err){
            //logger.info(err);
        }else{
            // //logger.info(data.body);
            res.send(data.body);
        }

    });
});
module.exports = router;
