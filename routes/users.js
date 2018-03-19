var express = require('express');
var router = express.Router();
var request=require('request');

var MatchHistoryModel=require('../model/MatchHistoryModel');
var AccountMatchHistoryModel=require('../model/AccountMatchHistoryModel');
var UserInfoModel=require('../model/UserInfo');

var dota2constant=require('dotaconstants');
var async=require('async');

let CONFIG=require('../config/config');
/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

var  userSummeries='http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key='+CONFIG.key+'&steamids=76561198081585830';
var RecentlyPlayedGames='http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1?key='+CONFIG.key+'&steamid=76561198081585830';
let getMatchHistoryURL='http://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1?key='+CONFIG.key;
let getMatchDetail='http://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1?key='+CONFIG.key+'&match_id=';

var matchhistory=new MatchHistoryModel();
var accountMatchHistoryModel=new AccountMatchHistoryModel();
var userInfoModel=new UserInfoModel();


let params=[123456,123456,818,0,0,7,'[{"id":1,"name":"jack"},{"id":2,"name":"bob"}]'];


//==========get user steam info=================
//getUserInfo();
function getUserInfo() {
    request(userSummeries,function (err, data) {
        if(err){
            throw console.error(err);
        }else{
         //  console.log(data.body);
           let result=JSON.parse(data.body).response.players[0];
           console.log(result);
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

        }
    });
}



//============match history================
let url=getMatchHistoryURL+'&matches_requested='+100+'&min_players='+2;
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
            for(var i in matches){
                let match_param=[];
                match_param.push(matches[i].match_id);
                match_param.push(matches[i].match_seq_num);
                match_param.push(matches[i].start_time);
                match_param.push(matches[i].lobby_type);
                match_param.push(matches[i].radiant_team_id);
                match_param.push(matches[i].dire_team_id);
                match_param.push(JSON.stringify(matches[i].players));
              //  console.log(match_param);
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
                setTimeout(function () {
                    getMatchHistory();
                },60000);
            }



        }
    });
}



//console.log(dota2constant.heroes[1]);

//===========================================获取用户所有比赛
/*async.eachSeries(dota2constant.heroes,function (item,callback) {
    getAccountMatchHistory(121320102,"",item.id,callback);
});*/
//insertAccountMatchHistory100(121320102);
function getAccountMatchHistory(account_id,start_at_match_id,hero_id,callback) {
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
                getAccountMatchHistory(121320102,lastID,hero_id,callback);

            }else {
                callback();
            }

        }
    });
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

        }
    });
}
let dataArray=[];
let get100Data=false;
if(get100Data){
    doOneHundred();
}
function doOneHundred(){

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

}
get100LastestAccountMatchIds(121320102);
function get100LastestAccountMatchIds (account_id) {
    accountMatchHistoryModel.selectAccount100([account_id],function (data ) {
        console.log( data.rows[0].match_id);


        async.eachSeries(data.rows,function (item, done) {
            let matchId=parseInt(item.match_id);
          //  console.log(item);

          getMatchDetails(account_id,matchId,done,function (data) {
             //  console.log(data);
               dataArray.push(data);
           });
            //console.log(dataArray);


        });




    });
}

function getMatchDetails(account_id,match_id,done,callback) {
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
