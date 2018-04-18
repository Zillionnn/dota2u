const  express = require('express');
const  router = express.Router();
const  request=require('request');
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
fetchMatchHistoryBySequenceNum();
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
    request(n_url,function (err, data) {
        if(err){
            console.error(data.body);
            console.error(err);


        }else{
            try{

                //console.log(data.body);
                let matches=JSON.parse(data.body).result.matches;
                async.series([
                    function (callback) {

                        //console.log(matches.length);
                        for(let i in matches){
                            let match=matches[i];
                            let match_id=match.match_id;
                            insertMatchDetails(match_id,match);

                        }

                        console.log("callback>>>>");
                        callback();
                    },
                    function (callback) {
                        if(matches[99]){
                            console.log("next 100");
                            let last_match_seq_num=matches[99].match_seq_num;
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
            }


        }
    });


}



/**
 * 无回调插入比赛详细；
 * @param match_id
 */
function insertMatchDetails(match_id,match) {
    console.log('insertMatchDetail');
    matchDetailModel.selectByMatchId([match_id],function (data) {
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
                        sql_pararms.push(match.start_time);
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
                        matchDetailModel.insert(sql_pararms,function (data) {
                            console.log("===INSERT MATCH DETAIL SUCCESS===\n");
                        })

        }
    });

}