const  dota2constant=require('dotaconstants');
const  async=require('async');
const  request=require('request');
const log=require('log4js').getLogger("sycnAllMatches_process");

const  UserInfoModel=require('../model/UserInfo');
const MatchDetailModel=require('../model/MatchDetailModel');

let userInfoModel=new UserInfoModel();
let matchDetailModel=new MatchDetailModel();
let CONFIG=require('../config/config');


/**
 * 同步玩家比赛数据，所有比赛
 * @param account_id
 * @constructor
 */
let account_id=process.argv[2];
console.log(`process ${account_id}`);
/*SynchronousPlayerMatches(account_id,function (data) {
    console.log(data);
});*/
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
    let getMatchHistoryURL='http://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1?key='+CONFIG.key;

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
                            let start_time=formatVTime(match.start_time);
                            //    console.log(start_time);
                            matchDetailModel.selectIDByMatchId([start_time,match.match_id],function (data) {
                                // log.info("select by id",data.rowCount);
                                if(data.rowCount==0){
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


function formatVTime(time_string) {
    let n_date=new Date(parseInt(time_string+'000')).toLocaleDateString();
    let n_time=new Date(parseInt(time_string+'000')).toTimeString();
    let end=n_time.indexOf("G");
    n_time=n_time.substring(0,end);
    let time=n_date+' '+n_time;
    return time;
};

/**
 * 写入比赛详细；callback
 * @param match_id
 * @param callback
 */

function insertMatchDetails(match_id,callback) {
    console.log("insertMatchDetails>>");

    let getMatchDetail='http://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1?key='+CONFIG.key+'&match_id=';

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
                sql_pararms.push(match.radiant_logo);
                sql_pararms.push(match.radiant_team_complete);
                sql_pararms.push(match.dire_team_id);
                sql_pararms.push(match.dire_name);
                sql_pararms.push(match.dire_logo);
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
