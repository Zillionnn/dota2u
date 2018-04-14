/**
 * Created by Zillion on 2018/4/14.
 */

let CONFIG=require('../config/config');
const  request=require('request');
const fs=require('fs');

let getItemsURL=`http://api.steampowered.com/IEconDOTA2_570/GetGameItems/v1?key=${CONFIG.key}&language=zh`;
request(getItemsURL,function (err, data) {
   // console.log(getItemsURL);
    if(err){
        console.error(err);
    }
    console.log(data.body);
    fs.writeFile('game_items.json',data.body,function (err,a,b,c) {
        console.log(err);
        console.log(a);
        console.log(b);
        console.log(c);
    });
});
