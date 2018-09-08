const  express = require('express');
const  router = express.Router();
const  request=require('request');
const rp=require('request-promise');
const fs=require('fs');
const log=require('log4js').getLogger("fetchALLMatchDetails");

const  MatchHistoryModel=require('../model/MatchHistoryModel');
const  AccountMatchHistoryModel=require('../model/AccountMatchHistoryModel');
const  UserInfoModel=require('../model/UserInfo');
const MatchDetailModel=require('../model/MatchDetailModel');


const  dota2constant=require('dotaconstants');
const  async=require('async');
//const dota2Client=require('../steam_dota2_client/dota2Client');

let CONFIG=require('../config/config');

let matchDetailModel=new MatchDetailModel();

let  MatchHistoryBySequenceNumURL='http://api.steampowered.com/IDOTA2Match_570/GetMatchHistoryBySequenceNum/v1?key='+CONFIG.key;


/**
 * 获取所有比赛详细；
 */

taskFetchMatchDetail();
function taskFetchMatchDetail(){
    let start_at_match_seq_num;
    fs.readFile('201701.json',function (err,data) {
        //   console.log(data.toString());
        start_at_match_seq_num=parseInt(data.toString());
        console.log(start_at_match_seq_num);
        fetchMatchHistoryBySequenceNum(start_at_match_seq_num,null);
    });

}
//"""""""""""""""452071414  """"""""""201402
//fetchMatchHistoryBySequenceNum(452071414,null);
function fetchMatchHistoryBySequenceNum(start_at_match_seq_num,matches_requested ) {
    let n_url = MatchHistoryBySequenceNumURL;
    let requestObj=new Object()
    requestObj.isRequest=false;
    requestObj.nextRequesting=false;
    if (start_at_match_seq_num) {
        n_url = n_url + '&start_at_match_seq_num=' + start_at_match_seq_num;
    }
    if (matches_requested) {
        n_url = n_url + "&matches_requested=" + matches_requested;
    }
    if (start_at_match_seq_num && matches_requested) {
        n_url = n_url + '&start_at_match_seq_num=' + start_at_match_seq_num + "&matches_requested=" + matches_requested;
    }
    console.log(n_url);
    console.log(start_at_match_seq_num);
    let time=new Date().toLocaleString();
    console.log(time);
    //没办法，无响应。递归
    let checkRequest=setTimeout(()=>{
        console.log('isRequest',requestObj);
        if(requestObj.isRequest==false){
            clearTimeout(checkRequest);
            requestObj.nextRequesting=true;
            fetchMatchHistoryBySequenceNum(start_at_match_seq_num);
        }
    },70000);
    fs.writeFile('201701.json',`${start_at_match_seq_num}`,function () {

    });


    request(n_url, function (err, data, body) {
        requestObj.isRequest=true;
        clearTimeout(checkRequest);
        if(requestObj.nextRequesting){
            console.warn("time to return....");
            return ;
        }
        if (err) {
            console.warn(err);
            setTimeout(function () {
                fetchMatchHistoryBySequenceNum(start_at_match_seq_num, null);
            }, 30000);
        } else if (!(/^2/.test('' + data.statusCode))) { // Status Codes other than 2xx
            console.log('res.code not 200');
            console.log(data.statusCode);
            setTimeout(function () {
                fetchMatchHistoryBySequenceNum(start_at_match_seq_num, null);
            }, 30000);

        } else {

            try {
                try {
                    //   console.log(body);
                    //console.log(data.body);
                    let matches = JSON.parse(data.body).result.matches;
                    let toInsertMatchArray=[];
                    async.series([
                        function (callback) {
                            async.eachSeries(matches,function (match, each_callback) {
                                insertMatchDetails(match.match_id,match,each_callback);
                            },function (err) {
                                if(err){
                                    console.error(err);
                                }else{
                                    console.log("over,");
                                    callback();
                                }
                            });

                        },
                        function (callback) {
                            if (matches[matches.length-1]) {
                                console.log("next 100");
                                let last_match_seq_num = matches[matches.length-1].match_seq_num ;
                                //  fetchMatchHistoryBySequenceNum(last_match_seq_num,null);
                                setTimeout(function () {
                                    fetchMatchHistoryBySequenceNum(last_match_seq_num, null);
                                }, 4567);

                            } else if(matches.length<100){
                                setTimeout(function () {
                                    fetchMatchHistoryBySequenceNum(last_match_seq_num, null);
                                }, 60000);
                            } else {
                                callback();
                            }
                        }
                    ]);
                } catch (e) {
                    console.log(e);
                    console.log(data.body);
                    log.error("fetch ALL MATCH DETAILS>>", e);
                    log.error("fetch ALL MATCH DETAILS>>", data.body);
                    setTimeout(function () {
                        fetchMatchHistoryBySequenceNum(start_at_match_seq_num);
                    }, 5000);

                }
            } catch (e) {
                console.error(e);
                setTimeout(function () {
                    fetchMatchHistoryBySequenceNum(start_at_match_seq_num);
                }, 5000);
            }

        }

    });


}


/**
 * 无回调插入比赛详细；
 * @param match_id
 */
function insertMatchDetails(match_id,match,callback) {
    console.log('insertMatchDetail');
    let start_time=formatVTime(match.start_time);
    matchDetailModel.selectIDByMatchId([start_time,match_id],function (data) {
        console.log("row count>>>",data.rowCount);
        if(data.rowCount==0){
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
            let start_time_param=formatVTime(match.start_time);
            sql_pararms.push(start_time_param);
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
         //   sql_pararms.push(match.radiant_logo);
            sql_pararms.push(match.radiant_team_complete);
            sql_pararms.push(match.dire_team_id);
            sql_pararms.push(match.dire_name);
         //   sql_pararms.push(match.dire_logo);
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

        }else{
            callback();
        }
    });

}

function insertMatchDetailsWithoutCallback(match_id,match) {

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
    })
}


function formatVTime(time_string) {
    let n_date=new Date(parseInt(time_string+'000')).toLocaleDateString();
    let n_time=new Date(parseInt(time_string+'000')).toTimeString();
    let end=n_time.indexOf("G");
    n_time=n_time.substring(0,end);
    let time=n_date+' '+n_time;
    return time;
};