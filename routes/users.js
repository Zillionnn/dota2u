var express = require('express');
var router = express.Router();
var request=require('request');
var MatchHistoryModel=require('../model/MatchHistoryModel');

let CONFIG=require('../config/config');
/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

var  userSummeries='http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='+CONFIG.key+'&steamids=76561198081585830';
var RecentlyPlayedGames='http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1?key='+CONFIG.key+'&steamid=76561198081585830';
let getMatchHistoryURL='http://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1?key='+CONFIG.key;
let getMatchDetail='http://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1?key='+CONFIG.key+'&match_id=';

var matchhistory=new MatchHistoryModel();
/*matchhistory.selectAll(function (data) {
    console.log("HERE",data);
})*/
let params=[123456,123456,818,0,0,7,'[{"id":1,"name":"jack"},{"id":2,"name":"bob"}]'];
/*matchhistory.insert(params,function (data) {
    console.log(data);
});*/

let url=getMatchHistoryURL+'&matches_requested='+10+'&min_players='+2;

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
            for(var i in matches){
                let match_param=[];
                match_param.push(matches[i].match_id);
                match_param.push(matches[i].match_seq_num);
                match_param.push(matches[i].start_time);
                match_param.push(matches[i].lobby_type);
                match_param.push(matches[i].radiant_team_id);
                match_param.push(matches[i].dire_team_id);
                match_param.push(JSON.stringify(matches[i].players));
                let rowcount_match_id;
                matchhistory.selectByMatchId([matches[i].match_id],function (data ) {
                    //    console.log("select by id",data.rowCount);
                    rowcount_match_id=data.rowCount;
                    if(rowcount_match_id<=0){
                        matchhistory.insert(match_param,function (data) {
                            console.log(data);
                        });
                    }
                });

            }
            console.log(matches[9]);
            if(matches[9]){
                let lastID=matches[9].match_id-1;
                getMatchHistory(lastID);
            }else{
                getMatchHistory();
            }



        }
    });
}

getMatchHistory();
/*matchhistory.selectOne(function (data) {
    console.log(data);
})*/
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
