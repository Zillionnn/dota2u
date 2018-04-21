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
//""""""3685840"""""201201
fetchMatchHistoryBySequenceNum(3685840,null);
function fetchMatchHistoryBySequenceNum(start_at_match_seq_num,matches_requested ) {
    let n_url=MatchHistoryBySequenceNumURL;
    if(start_at_match_seq_num){
        n_url=n_url+'&start_at_match_seq_num='+start_at_match_seq_num;
    }
    if(matches_requested){
        n_url=n_url+"&matches_requested="+matches_requested;
    }
    if(start_at_match_seq_num&&matches_requested){
        n_url=n_url+'&start_at_match_seq_num='+start_at_match_seq_num+"&matches_requested="+matches_requested;
    }
    console.log(n_url);
    console.log(start_at_match_seq_num);
    rp(n_url).then(function (data) {
      //  console.log(JSON.parse(data).result.matches);

        try{
            //   console.log(body);
            //console.log(data.body);
            let matches=JSON.parse(data).result.matches;
            console.log(matches.length);
            if(matches.length==0){
                console.log("it's none   request again");
                setTimeout(function () {
                    fetchMatchHistoryBySequenceNum(start_at_match_seq_num,null)
                },5000);
            }
            async.series([
                function (callback) {
                    for(var i in matches){
                        let match_id=matches[i].match_id;
                        let match=matches[i];

                        insertMatchDetailsWithoutCallback(match_id,match);

                        if(i==99){
                            console.log("callback>>>>next step");
                            callback();
                        }
                    }
                    //console.log(matches.length);
                    /*     async.eachSeries(matches,function(match,inside_callback){
                             let match_id=match.match_id;
                             insertMatchDetails(match_id,match, inside_callback);

                         },function (err) {
                             if(err){
                                 console.log(err);
                                 log.error(err);
                             }
                             console.log("callback>>>>next step");
                             callback();
                         });*/

                },
                function (callback) {
                let last_index=matches.length-1;
                    if(matches[last_index]){

                        console.log("next 100", last_index);
                        let last_match_seq_num=matches[last_index].match_seq_num+1;
                        //  fetchMatchHistoryBySequenceNum(last_match_seq_num,null);
                        setTimeout(function () {
                            fetchMatchHistoryBySequenceNum(last_match_seq_num,null);
                        },5000);

                    }else{
                      //  fetchMatchHistoryBySequenceNum(last_match_seq_num,null);
                        callback();
                    }
                }
            ]);
        }catch (e) {
            console.log(e);
            console.log(data.body);
            log.error("fetch ALL MATCH DETAILS>>",e);
            log.error("fetch ALL MATCH DETAILS>>",data.body);
            setTimeout(function () {
                fetchMatchHistoryBySequenceNum(start_at_match_seq_num);
            },10000);

        }
    }).catch(function (err) {
        console.error("err",err);
        console.log("request again",start_at_match_seq_num);
        fetchMatchHistoryBySequenceNum(start_at_match_seq_num,null);
    });



  /*  request(n_url,function (err, data,body) {

       try{
           try{
               //   console.log(body);
               //console.log(data.body);
               let matches=JSON.parse(data.body).result.matches;
               async.series([
                   function (callback) {
                       for(var i in matches){
                           let match_id=matches[i].match_id;
                           let match=matches[i];

                           insertMatchDetailsWithoutCallback(match_id,match);

                           if(i==99){
                               console.log("callback>>>>next step");
                               callback();
                           }
                       }
                       //console.log(matches.length);
                  /!*     async.eachSeries(matches,function(match,inside_callback){
                           let match_id=match.match_id;
                           insertMatchDetails(match_id,match, inside_callback);

                       },function (err) {
                           if(err){
                               console.log(err);
                               log.error(err);
                           }
                           console.log("callback>>>>next step");
                           callback();
                       });*!/

                   },
                   function (callback) {
                       if(matches[99]){
                           console.log("next 100");
                           let last_match_seq_num=matches[99].match_seq_num+1;
                         //  fetchMatchHistoryBySequenceNum(last_match_seq_num,null);
                              setTimeout(function () {
                                  fetchMatchHistoryBySequenceNum(last_match_seq_num,null);
                              },5000);

                       }else{
                           callback();
                       }
                   }
               ]);
           }catch (e) {
               console.log(e);
               console.log(data.body);
               log.error("fetch ALL MATCH DETAILS>>",e);
               log.error("fetch ALL MATCH DETAILS>>",data.body);
               setTimeout(function () {
                   fetchMatchHistoryBySequenceNum(start_at_match_seq_num);
               },10000);

           }
       }catch (e) {
           console.error(e);
           setTimeout(function () {
               fetchMatchHistoryBySequenceNum(start_at_match_seq_num);
           },10000);
       }




    });*/


}



/**
 * 无回调插入比赛详细；
 * @param match_id
 */
function insertMatchDetails(match_id,match,callback) {
    console.log('insertMatchDetail');
    matchDetailModel.selectIDByMatchId([match_id],function (data) {
        console.log("row count>>>",data.rowCount);
        if(data.rowCount==0){
                        let sql_pararms=[];
                        let player_accounts=[];
                        for(var i in match.players){
                            player_accounts.push(match.players[i].account_id);
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