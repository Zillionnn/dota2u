var steam = require("steam"),
    util = require("util"),
    fs = require("fs"),
    crypto = require("crypto"),
    dota2 = require("dota2"),
    steamClient = new steam.SteamClient(),
    steamUser = new steam.SteamUser(steamClient),
    steamFriends = new steam.SteamFriends(steamClient),
    Dota2 = new dota2.Dota2Client(steamClient, true);

global.config = require("./config");

const async=require("async");
const request=require('request');

var onSteamLogOn = function onSteamLogOn(logonResp) {
    console.log("on steam log on");
    console.log(logonResp);
        if (logonResp.eresult == steam.EResult.OK) {
            console.log("login in");
            steamFriends.setPersonaState(steam.EPersonaState.Busy);
            steamFriends.setPersonaName(global.config.steam_name);
            util.log("Logged on.");

            Dota2.launch();

            Dota2.on("ready", function() {
                util.log("Node-dota2 ready.");




                let match_id=-1;
                if(match_id>0){
                    Dota2.requestMatchDetails(match_id,function (err, data) {
                        if(err){
                            console.log(err);
                        }else{
                            console.log("REQUEST MATCH DETAILS ");
                            console.log(JSON.stringify(data));
                        }
                    });
                }


                Dota2.on("matchDetailsData",function (match_id, matchDetailsResponse) {
                    console.log("EVENT  >> MATCHDETAILSDATA");
                    console.log(match_id);
                    console.log(matchDetailsResponse);
                });
           //     getMatchHistory();

         /*       Dota2.requestMatches({
                    "matches_requested":6
                }, (result,response) => {

                    response.matches.map(match => {
                     //    console.log(match);
                        let match_id=parseInt(match.match_id+"");
                        //   console.log(typeof  match_id);

                       matchIdArray.push(match_id);
                    });
                     console.log(matchIdArray);
                     var lastID = response.matches[5].match_id - 1;
                     getMatchHistory(lastID);

                });*/

           /*     let firstMatchId;
                var data='';
                // 创建可读流
                var readerStream = fs.createReadStream('./matchIdList/match_idList.json');

// 设置编码为 utf8。
                readerStream.setEncoding('UTF8');

// 处理流事件 --> data, end, and error
                readerStream.on('data', function(chunk) {
                    data += chunk;
                });

                readerStream.on('end',function(){
                    console.log(data);
                    async.eachSeries(JSON.parse(data),function (item, callback) {
                        requestDetail(item,callback);

                    });
                });

                readerStream.on('error', function(err){
                    console.log(err.stack);
                });*/




                //Dota2 on ready
            });

            Dota2.on("unready", function onUnready() {
                util.log("Node-dota2 unready.");
            });



            Dota2.on("unhandled", function(kMsg) {
                util.log("UNHANDLED MESSAGE " + dota2._getMessageName(kMsg));
            });
        }
    },
    onSteamServers = function onSteamServers(servers) {
        util.log("Received servers.");
        fs.writeFile('servers', JSON.stringify(servers), (err) => {
            if (err) {if (this.debug) util.log("Error writing ");}
            else {if (this.debug) util.log("");}
        });
    },
    onSteamLogOff = function onSteamLogOff(eresult) {
        util.log("Logged off from Steam.");
    },
    onSteamError = function onSteamError(error) {
        util.log("Connection closed by server.");
    };



var logOnDetails = {
    "account_name": global.config.steam_user,
    "password": global.config.steam_pass,
};
if (global.config.steam_guard_code) logOnDetails.auth_code = global.config.steam_guard_code;
if (global.config.two_factor_code) logOnDetails.two_factor_code = global.config.two_factor_code;

try {
    var sentry = fs.readFileSync('sentry');
    if (sentry.length) logOnDetails.sha_sentryfile = sentry;
}
catch (beef){
    util.log("Cannot load the sentry. " + beef);
}

steamClient.connect();

setTimeout(function () {
    Dota2.exit();
    steamClient.disconnect();
    console.log("==CLIENT DISCONNECTED==");
},60000);


steamClient.on('connected', function() {
    console.log(logOnDetails);
    console.log("connected");
    steamUser.logOn(logOnDetails);
});

steamClient.on('logOnResponse', onSteamLogOn);
steamClient.on('loggedOff', onSteamLogOff);
steamClient.on('error', onSteamError);
steamClient.on('servers', onSteamServers);

//"start_at_match_id": 3678915501
let matchIdArray=[];
function getMatchHistory(match_id) {
    let options={
        "matches_requested":6
    };
 /*   if(match_id){
        options. start_at_match_id=match_id;
    }*/
    Dota2.requestMatches(options, (result,response) => {

        response.matches.map(match => {
          //  console.log(match);
            let match_id=parseInt(match.match_id+"");
         //   console.log(typeof  match_id);

            matchIdArray.push(match_id);
        });
        console.log(matchIdArray);
        fs.writeFile(`./matchIdList/match_idList.json`,JSON.stringify(matchIdArray),function (err) {
            if(err ){
                console.log(err);
            }
            console.log("=====write checkingMatch.json over=======");
        });        
        var lastID = response.matches[5].match_id - 1;
        setTimeout(()=>{
            getMatchHistory(lastID);
        },10000);



    });
}



/*request(url,function (err, data) {
    if(err){

    }else{
        let result=JSON.parse(data.body);
        let matches=result.result.matches;
        let matchIdArray=[];
        for(var i in matches){
            matchIdArray.push(matches[i].match_id);
        }
        console.log(matchIdArray);
        async.eachSeries(matchIdArray,function (match_id, callback) {
            requestMatchDetail(match_id,callback);
            /!*           if(matchIdArray[9]==match_id){
             let new_url=url+'&start_at_match_id='+matchIdArray[9];
             console.log("new_url>>"+new_url);
             getMatchHistory(new_url);
             }*!/

        });
    }
})*/
function requestDetail(match_id,callback) {

    Dota2.requestMatchDetails(match_id, function(err, data){
        console.log("check Match id>>");
        util.log(JSON.stringify(data));
        let match_id=data.match.match_id;
        let duration=data.match.duration;
        let cluster=data.match.cluster;
        let replay_salt=data.match.replay_salt;
        let replay_state=data.match.replay_state;
        let game_mode=data.match.game_mode;
        let duration_m=(duration/60).toFixed(0);

            console.log("    match_id>>"+match_id);
            console.log("    duration_m>>"+duration_m);
            console.log("    cluster>>"+cluster);
            console.log("  game_mode>>"+game_mode);
            console.log("    replay_salt>>"+replay_salt);
            console.log("    replay_state>>"+replay_state);

        if (replay_state!='REPLAY_EXPIRED') {
            console.log('REPLAY_AVAILABLE============START DOWNLOAD========');
            let downloadUrl = `http://replay${cluster}.valve.net/570/${match_id}_${replay_salt}.dem.bz2`;
            console.log(downloadUrl);
            let fileName = `./download/${match_id}.dem.bz2`;
            //开始下载
            var stream=fs.createWriteStream(fileName);
            request(downloadUrl).pipe(stream).on('close',callback);

        }else{
            callback();
        }
    });

}


exports.ToSteamID=function (account_id) {
    console.log("dota2 client>>",account_id);
    let steam_id=Dota2.ToSteamID(account_id);
    console.log(steam_id.toString());
    return steam_id.toString();

};