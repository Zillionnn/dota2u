var express = require('express');
var router = express.Router();
var request=require('request');
var _pgdb=require('../config/pgDB');
var util=require('util');

let CONFIG=require('../config/config');


var  userSummeries='http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='+CONFIG.key+'&steamids=76561198081585830';
var RecentlyPlayedGames='http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1?key='+CONFIG.key+'&steamid=76561198081585830';
let getMatchHistory='http://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1?key='+CONFIG.key;
let getMatchDetail='http://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1?key='+CONFIG.key+'&match_id=';

let url=getMatchHistory+'&matches_requested='+10+'&min_players='+2;

let query="select * from t_match_history";

function TestModel(obj) {
    this.params=obj;
}
//继承
util.inherits(TestModel,_pgdb);

TestModel.prototype.selectAll=function (callback) {
     this._query(query,[],function (data) {
     callback( data);
    });
}

var test=new TestModel();
/*test.selectAll(function (data) {
    console.log(data);
});*/

test.


/*    request(url,function (err, data) {
        if(err){
            console.info(err);
        }else{
          console.log(data.body);

        }
    })*/



