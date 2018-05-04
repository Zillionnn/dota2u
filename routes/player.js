const  express = require('express');
const  router = express.Router();
const  request=require('request');
const fs=require('fs');
const log=require('log4js').getLogger("player");
const child_process =require('child_process');

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
    console.log('getRecentMatchesByAccount',account)
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
        //console.log(data);
        res.send(data);
    });
});

/***
 * 通过steam web api 查询玩家信息；
 */
router.post('/fetchUserInfoByAccount',function (req, res, next) {
    /*log.info(req.body);
    log.info("process===",process.pid);*/
    let rank_tier,
        leaderboard_rank,
        account_id=req.body.account;

    getPlayerProfile(account_id,function (data) {
        rank_tier=data.rank_tier.toString();
        leaderboard_rank=data.leaderboard_rank;
        userInfoModel.updatePlayerRank([rank_tier,leaderboard_rank,account_id],function (data) {
            console.log(data);
        });
        fetchUserInfo(account_id,function (data) {
            let profile=data;
            profile.rank_tier=rank_tier;
            profile.leaderboard_rank=leaderboard_rank;
         //   console.log("profile>>>",profile);
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
   /* child_process.exec(`node process/sycnAllMatches_process.js  ${account_id}`,function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log('Error code: '+error.code);
            console.log('Signal received: '+error.signal);
        }
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
    });*/
    SynchronousPlayerMatches(account_id,function (data) {
        console.log(data);
        res.json(data);
    });
    
});

/**
 * 获取玩家所有比赛
 */
router.get('/getAllMatches/:account_id',function (req, res,next) {
    let account_id=req.params.account_id;
    console.log(account_id);
    getAllMatchSumByAccountID(account_id,function (data) {
        res.json(data);
    });

});


/**
 * ============================================================
 * */
let  userSummeries='http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key='+CONFIG.key;
let RecentlyPlayedGames='http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1?key='+CONFIG.key+'&steamid=76561198081585830';
let getMatchHistoryURL='http://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1?key='+CONFIG.key;
let getMatchDetail='http://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1?key='+CONFIG.key+'&match_id=';
let  MatchHistoryBySequenceNumURL='http://api.steampowered.com/IDOTA2Match_570/GetMatchHistoryBySequenceNum/v1?key='+CONFIG.key;

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
             log.error(err);
             fetchUserInfo(account_id,callback);
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
                            }
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
            console.log('error');
            setTimeout(function () {
                 getAccountMatchHistorySeries(account_id,start_at_match_id,hero_id,callback);
                },30000);
        }else if (!(/^2/.test('' + data.statusCode))) { // Status Codes other than 2xx
            console.log('res.code not 200');
            console.log(data.statusCode);
            setTimeout(function () {
                getAccountMatchHistorySeries(account_id,start_at_match_id,hero_id,callback);
            }, 30000);

        }else{
            //  //logger.info(data.body);
            try{
                var matches=JSON.parse(data.body).result.matches;
                //  log.info(matches);

                async.series([
                    function (series_callback) {

                        async.eachSeries(matches,function (match, callback_c) {
                            console.log("in series>");
                            let start_time=formatVTime(match.start_time);
                        //    console.log(start_time);
                            matchDetailModel.selectIDByMatchId([start_time,match.match_id],function (data) {

                               console.log(`data.rowCount> ${start_time}     ${match.match_id}   ${data.rowCount}`);
                                if(data.rowCount==0){
                                    insertMatchDetails(match.match_id, callback_c);

                                }else if(data.rowCount>1){
                                    matchDetailModel.deleteMatchDetail([start_time,match.match_id],function () {
                                        console.warn(`has delete the same`);
                                        insertMatchDetails(match.match_id,callback_c);
                                    });
                                }else{
                                    callback_c();
                                }
                            });

                        },function (err) {
                            if(err){
                                console.error(err);
                                log.error("IN getAccountMatchHistorySeries async error ERROR>>",err);
                            }else{

                                series_callback();
                            }
                        });

                    },
                    //接上一步做完；
                    function (series_callback) {
                        if(matches[249]){
                            console.log("has the next 10 matches");
                            let lastID=matches[249].match_id-1;
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
    let url=getMatchHistoryURL+'&matches_requested='+50+'&min_players='+2;
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
          //  console.log(JSON.parse(data.body).result);
            let results_remaining=JSON.parse(data.body).result.results_remaining;
            //  log.info(matches);

            async.series([
                function (series_callback) {
                    async.eachSeries(matches,function (match, callback_c) {
                        console.log(" 500  in series>>");

                     //   let rowcount_match_id;
                        let start_time=formatVTime(match.start_time);
                        console.log(start_time);
                        matchDetailModel.selectIDByMatchId([start_time,match.match_id],function (data) {
                            console.log("row count is>", data.rowCount);
                            if(data.rowCount==0){
                                insertMatchDetails(match.match_id, callback_c);
                            }else{
                               // update_over=true;
                                console.log("result_remianing    ",results_remaining);

                                if(results_remaining>=400){
                                    console.log("series callback()");
                                    callback_c();
                                   // series_callback();
                                }else{
                                    series_callback();
                                }

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
                 //   console.log("update_over>>",update_over);
                    if(results_remaining>400){
                        if(matches[49]){
                            console.log("has the next 10 matches");
                            let lastID=matches[49].match_id-1;
                            updateAccount500MatchHistory(account_id,lastID,null,callback_main);
                        }
                    }else{
                        console.log('update player RECENT matches OVER>>');
                        callback_main({"result":200});
                      /*  matchDetailModel.selectRecentByContainAccountIDLimit20([[account_id]],function (data) {
                            //更新同步情况

                            for(let i in data.rows){
                                matches.push(data.rows[i]);
                            }
                            //返回结果
                            callback_main(matches);
                        });*/
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
    let recentURL=getMatchHistoryURL+'&matches_requested='+50+'&min_players='+2;
    let new_url=recentURL+'&account_id='+account_id;
    console.log(new_url);
    console.log("get player recent match history>>");

    request(new_url,function (err,data) {
        if(err){
            log.error(err);
        }else{
            //  //logger.info(data.body);
            try{

                let result=JSON.parse(data.body).result;
             console.log(result);
                if(result.status!=1){
                    callback({error:403});
                    return;
                }
                let matches=result.matches;

                if(matches){
                    let latest_match_id=matches[0].match_id;
                    let latest_49th_match_id=matches[49].match_id;
                    console.log(`latest_match_id=${latest_match_id}  ${typeof  latest_match_id} and ${latest_49th_match_id}` );
                    
                    //match_id 可以重复   match_detail 表里的不可以重复
               //     accountMatchHistoryModel.selectByMatchId([lastest_match_id],function (data) {
                    matchDetailModel.selectRecentByContainAccountIDLimit20([[account_id]],function (data) {
                      //  console.log("selectRecentByContainAccountIDLimit20>>",data.rowCount);
                        let handleRows=data.rows.slice(0,100);
                     //   console.log("最近20场？？",handleRows);

                       // console.log(  data.rows[19].match_id);
                        if(handleRows.length<100 ){
                            console.warn("no  100   matches   THE ACCOUNT NEED TO UPDATE DATA");
                            //更新玩家比赛记录
                            updatePlayerMatchHistory(account_id,function (data) {
                                callback(data);
                            });
                        }else if(parseInt(data.rows[0].match_id)!=latest_match_id || parseInt(data.rows[49].match_id)!=latest_49th_match_id){
                            console.warn("not newest matches THE ACCOUNT NEED TO UPDATE DATA");
                            //更新玩家比赛记录
                            updatePlayerMatchHistory(account_id,function (data) {
                                callback(data);
                            });
                        } else{
                            console.warn("all matches are recent");
                            callback({"result":200});
                        }
                    });

                }
            }catch (e){
                console.error(e);
                log.error(e);
            }

        }
    });

}

/**
 *
 *
 * 更新玩家比赛记录
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
            updateAccount500MatchHistory(account_id,null,null,function (data) {
                callback(data);
            });
        }else{
            SynchronousPlayerMatches(account_id,callback);
            //TODO 需要指定进程？
         /*   updateAccount500MatchHistory(account_id,null,null,function (data) {

                callback(data);
            });*/
            console.log(synchron);
            //==========更新用户所有比赛=========
         /*   console.log('=更新用户所有比赛==');
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
            });*/
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



/**
 * 写入比赛详细；callback
 * @param match_id
 * @param callback
 */

function insertMatchDetails(match_id,callback) {
    console.log("insertMatchDetails>>");


            let url=getMatchDetail+match_id;
            log.info(url);

            request(url,function (err,data) {
                if (err) {
                    //handleError({ error: err, response: response, ... });
                } else if (!(/^2/.test('' + data.statusCode))) { // Status Codes other than 2xx
                    insertMatchDetails(match_id,callback);
                } else {
                    //  log.info(data.body);
                    try{
                        let match=JSON.parse(data.body).result;

                        let sql_pararms=[];

                        let player_accounts=[];
                        let account_array=[];
                        let players=match.players;
                        for(var i in players){
                            player_accounts.push(players[i].account_id);
                            if(players[i].hasOwnProperty("account_id")){
                                account_array.push(parseInt(players[i].account_id));
                            }else{
                                account_array.push(4294967295);
                            }
                        }
                        sql_pararms.push(match.match_id);
                        sql_pararms.push(match.match_seq_num);
                        sql_pararms.push(match.radiant_win);
                        sql_pararms.push(match.duration);
                        let start_time=formatVTime(match.start_time);
                        sql_pararms.push(start_time);
                        sql_pararms.push(match.tower_status_radiant);
                        sql_pararms.push(match.tower_status_dire);
                        sql_pararms.push(match.barracks_status_radiant);
                        sql_pararms.push(match.barracks_status_dire);
                        sql_pararms.push(match.cluster);
                        sql_pararms.push(match.first_blood_time);
                        sql_pararms.push(match.lobby_type);
                        sql_pararms.push(match.human_players);
                        sql_pararms.push(match.leagueid);
                        sql_pararms.push(match.positive_votes);
                        sql_pararms.push(match.negative_votes);
                        sql_pararms.push(match.game_mode);
                        sql_pararms.push(match.flags);
                        sql_pararms.push(match.engine);
                        sql_pararms.push(match.radiant_score);
                        sql_pararms.push(match.dire_score);
                        sql_pararms.push(match.tournament_id);
                        sql_pararms.push(match.tournament_round);
                        sql_pararms.push(match.radiant_team_id);
                        sql_pararms.push(match.radiant_name);
                    //    sql_pararms.push(match.radiant_logo);
                        sql_pararms.push(match.radiant_team_complete);
                        sql_pararms.push(match.dire_team_id);
                        sql_pararms.push(match.dire_name);
                   //     sql_pararms.push(match.dire_logo);
                        sql_pararms.push(match.dire_team_complete);
                        sql_pararms.push(match.radiant_captain);
                        sql_pararms.push(match.dire_captain);
                        sql_pararms.push(JSON.stringify(player_accounts));
                        sql_pararms.push(JSON.stringify(match.players));
                        sql_pararms.push(JSON.stringify(match.picks_bans));
                        sql_pararms.push(account_array);

                        matchDetailModel.insertPartition(sql_pararms,function (data) {
                            console.log("===INSERT MATCH DETAIL SUCCESS===\n");
                            callback();
                        })
                    }catch (e){
                        console.error(e);
                        log.error("insertMatchDetails>>",e);
                        log.error("insertMatchDetails  BODY>>>\n",data.body);
                    }
                    
                }
            });

}



/**
 * 无回调插入比赛详细；
 * @param match_id
 */
function insertMatchDetailsWithoutCallback(match_id) {
    console.log('insertMatchDetailsWithoutCallback');

            let url=getMatchDetail+match_id;

            request(url,function (err,data) {
                if(err){
                    //logger.info(err);
                }else{
                    //  log.info(data.body);
                    try{
                        let match=JSON.parse(data.body).result;

                        let sql_pararms=[];

                        let player_accounts=[];
                        let account_array=[];
                        let players=match.players;
                        for(var i in players){
                            player_accounts.push(players[i].account_id);
                            if(players[i].hasOwnProperty("account_id")){
                                account_array.push(parseInt(players[i].account_id));
                            }else{
                                account_array.push(4294967295);
                            }
                        }
                        sql_pararms.push(match.match_id);
                        sql_pararms.push(match.match_seq_num);
                        sql_pararms.push(match.radiant_win);
                        sql_pararms.push(match.duration);
                        let start_time=formatVTime(match.start_time);
                        sql_pararms.push(start_time);
                        sql_pararms.push(match.tower_status_radiant);
                        sql_pararms.push(match.tower_status_dire);
                        sql_pararms.push(match.barracks_status_radiant);
                        sql_pararms.push(match.barracks_status_dire);
                        sql_pararms.push(match.cluster);
                        sql_pararms.push(match.first_blood_time);
                        sql_pararms.push(match.lobby_type);
                        sql_pararms.push(match.human_players);
                        sql_pararms.push(match.leagueid);
                        sql_pararms.push(match.positive_votes);
                        sql_pararms.push(match.negative_votes);
                        sql_pararms.push(match.game_mode);
                        sql_pararms.push(match.flags);
                        sql_pararms.push(match.engine);
                        sql_pararms.push(match.radiant_score);
                        sql_pararms.push(match.dire_score);
                        sql_pararms.push(match.tournament_id);
                        sql_pararms.push(match.tournament_round);
                        sql_pararms.push(match.radiant_team_id);
                        sql_pararms.push(match.radiant_name);
                        //sql_pararms.push(match.radiant_logo);
                        sql_pararms.push(match.radiant_team_complete);
                        sql_pararms.push(match.dire_team_id);
                        sql_pararms.push(match.dire_name);
                  //      sql_pararms.push(match.dire_logo);
                        sql_pararms.push(match.dire_team_complete);
                        sql_pararms.push(match.radiant_captain);
                        sql_pararms.push(match.dire_captain);
                        sql_pararms.push(JSON.stringify(player_accounts));
                        sql_pararms.push(JSON.stringify(match.players));
                        sql_pararms.push(JSON.stringify(match.picks_bans));
                        sql_pararms.push(account_array);

                        matchDetailModel.insertPartition(sql_pararms,function (data) {
                            console.log("===INSERT MATCH DETAIL withoutcallback SUCCESS===\n");
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


/**
 * 同步玩家比赛数据，所有比赛
 * @param account_id
 * @constructor
 */
function SynchronousPlayerMatches(account_id,callback){
    console.log("====更新玩家所有比赛=====");
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

/**
 * 从数据库查询该玩家所有比赛
 * @param account_id
 */
function getAllMatchSumByAccountID(account_id,callback){
    matchDetailModel.selectSummeryByAccountID([account_id,[account_id]],function (data) {
        console.log(data.rows.length);

        callback(data.rows);
    });
/*  matchDetailModel.selectByPlayersContain([2,2,{"account_id":account_id}],function (data) {
      console.log(data);
      callback(data.rows);
  });*/
}

function formatVTime(time_string) {
    let n_date=new Date(parseInt(time_string+'000')).toLocaleDateString();
    let n_time=new Date(parseInt(time_string+'000')).toTimeString();
    let end=n_time.indexOf("G");
    n_time=n_time.substring(0,end);
    let time=n_date+' '+n_time;
    return time;
};


module.exports = router;
