const  express = require('express');
const  router = express.Router();
const  request=require('request');
const rp=require('request-promise');
const fs=require('fs');
const spawn=require('child_process').spawn;
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

let MatchHistoryURL='http://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1?key='+CONFIG.key+'&matches_requested=100';
let getMatchDetail='http://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1?key='+CONFIG.key+'&match_id=';


/**
 * 获取所有比赛详细；
 */
//taskFetchMatchHistory();
function taskFetchMatchHistory(){
    let start_at_match_id;
    fs.readFile('match_id_history.json',function (err,data) {
        //   console.log(data.toString());
        start_at_match_id=parseInt(data.toString());
        console.log(start_at_match_id);
        fetchMatchHistory(start_at_match_id,1);
        fetchMatchHistory(start_at_match_id,2);
        fetchMatchHistory(start_at_match_id,3);
    });

}

//""""""""""""""""13728896    """""    """"201204
//fetchMatchHistory(13667070,null);
fetchMatchHistory(null,1);
setTimeout(function () {
    fetchMatchHistory(null,2);
},3000);
setTimeout(function () {
    fetchMatchHistory(null,3);
},6000);
function fetchMatchHistory(start_at_match_id,skill) {
    let requestObj=new Object();
    requestObj.isRequest=false;
    requestObj.nextRequesting=false;
    let n_url = MatchHistoryURL;
    if (start_at_match_id) {
        n_url = n_url + '&start_at_match_id=' + start_at_match_id;
    }
    if(skill){
        n_url=`${n_url}&skill=${skill}`;
    }

    console.log(n_url);
    console.log(start_at_match_id);
    let time=new Date().toLocaleString();
    //let match_skill=skill;
    console.log(time);
    fs.writeFile('match_id_history.json',`${start_at_match_id}`,function () {

    });

    //没办法，无响应。递归
    let checkRequest=setTimeout(()=>{
        console.log('isRequest',requestObj);
        if(requestObj.isRequest==false){
            clearTimeout(checkRequest);
            requestObj.nextRequesting=true;
            fetchMatchHistory(start_at_match_id, skill);
        }
    },70000);

        request(n_url, function (err, data, body) {
            requestObj.isRequest=true;
            clearTimeout(checkRequest);
            console.log(requestObj);
            if(requestObj.nextRequesting){
                console.warn("time to return....");
                return ;
            }
            if (err) {
                //handleError({ error: err, response: response, ... });
                console.warn(err);
                setTimeout(function () {
                    fetchMatchHistory(start_at_match_id, skill);
                }, 30000);
            } else if (!(/^2/.test('' + data.statusCode))) { // Status Codes other than 2xx
                console.log('res.code not 200');
                console.log(data.statusCode);
                setTimeout(function () {
                    fetchMatchHistory(start_at_match_id, skill);
                }, 30000);

            } else {

                try {
                    try {
                        //   console.log(body);
                        //console.log(data.body);
                        let matches = JSON.parse(data.body).result.matches;
                        let results_remaining=JSON.parse(data.body).result.results_remaining;
                        //     console.log(matches);

                        async.series([
                            function (callback) {
                                async.eachSeries(matches,function (match, each_callback) {
                                    insertMatchDetails(match,skill,each_callback);
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
                                console.log("        result.results_remaining;",results_remaining);
                                if(results_remaining==0){
                                    setTimeout(()=>{
                                        fetchMatchHistory(null,skill);
                                    },30000);

                                }else{
                                    if (matches[matches.length-1]) {
                                        console.log("next 100");
                                        let last_match_id = matches[matches.length-1].match_id ;
                                        //  fetchMatchHistory(last_match_id,null);
                                        setTimeout(function () {
                                            fetchMatchHistory(last_match_id, skill);
                                        }, 5000);

                                    } else {
                                        callback();
                                    }
                                }

                            }
                        ]);
                    } catch (e) {
                        console.log(e);
                        console.log(data.body);
                        log.error("fetch ALL MATCH DETAILS>>", e);
                        log.error("fetch ALL MATCH DETAILS>>", data.body);
                        setTimeout(function () {
                            fetchMatchHistory(start_at_match_id,skill);
                        }, 5000);

                    }
                } catch (e) {
                    console.error(e);
                    setTimeout(function () {
                        fetchMatchHistory(start_at_match_id,skill);
                    }, 5000);
                }

            }

        });



}



function insertMatchDetails(match,skill,callback) {
    let match_id=match.match_id;
    let start_time=formatVTime(match.start_time);
    console.log(match_id,start_time);
    matchDetailModel.selectIDByMatchId([start_time,match_id],function (data) {
        console.log("row count>>>",data.rowCount);
        let isRequest=false;
        if(data.rowCount==0){
            let url=getMatchDetail+match_id;
            let checkDetailRequest=setTimeout(()=>{
                console.log('isRequest',isRequest);
                if(isRequest==false){
                    clearTimeout(checkDetailRequest);
                    isRequest=true;
                    insertMatchDetails(match,skill,callback);
                }
            },70000);
            if(isRequest==false){
                request(url,function (err,data) {
                    isRequest=true;
                    clearTimeout(checkDetailRequest);

                    if (err) {
                        //handleError({ error: err, response: response, ... });
                    } else if (!(/^2/.test('' + data.statusCode))) { // Status Codes other than 2xx
                        console.log('res.code not 200');
                        console.log(data.statusCode);
                        setTimeout(()=>{
                            insertMatchDetails(match,skill, callback);
                        },3210);
                    }
                    else {
                        isRequest=true;
                        let match=JSON.parse(data.body).result;
                        let sql_pararms = [];
                        let player_accounts = [];
                        let account_array = [];
                        let players = match.players;

                        for (var i in players) {
                            player_accounts.push(players[i].account_id);
                            if (players[i].hasOwnProperty("account_id")) {
                                account_array.push(parseInt(players[i].account_id));
                            } else {
                                account_array.push(4294967295);
                            }
                        }
                        sql_pararms.push(match.match_id);
                        sql_pararms.push(match.match_seq_num);
                        sql_pararms.push(match.radiant_win);
                        sql_pararms.push(match.duration);
                        let start_time_param = formatVTime(match.start_time);
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
                      //  sql_pararms.push(match.radiant_logo);
                        sql_pararms.push(match.radiant_team_complete);
                        sql_pararms.push(match.dire_team_id);
                        sql_pararms.push(match.dire_name);
                      //  sql_pararms.push(match.dire_logo);
                        sql_pararms.push(match.dire_team_complete);
                        sql_pararms.push(match.radiant_captain);
                        sql_pararms.push(match.dire_captain);
                        sql_pararms.push(JSON.stringify(player_accounts));
                        sql_pararms.push(JSON.stringify(match.players));
                        sql_pararms.push(JSON.stringify(match.picks_bans));
                        sql_pararms.push(account_array);
                        sql_pararms.push(skill);

                        matchDetailModel.insertPartitionHasSkill(sql_pararms, function (data) {
                            console.log("===INSERT MATCH DETAIL SUCCESS===\n");
                            callback();
                        })


                    }

                });
            }

        }else{
            callback();
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