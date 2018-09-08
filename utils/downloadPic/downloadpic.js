const fs=require('fs');
const request=require('request');
const dotaconstants =require('dotaconstants');


let heroes=dotaconstants.hero;
for(var i in heroes){
    let hero_name=heroes[i].name.substring(14,heroes[i].name.length);
   console.log(hero_name);
   let url=`https://api.opendota.com/apps/dota2/images/heroes/${hero_name}_icon.png`;
   downloadReply(url,`./hero_icon/${hero_name}_icon.png`,function (data) {
       console.log(data);
   })
}
//let url='http://replay227.valve.net/570/3876545217_1920391580.dem.bz2';
 function downloadReply(uri, filename, callback) {
    var stream=fs.createWriteStream(filename);
    request(uri).pipe(stream).on('close',function (data) {
        console.log(data);
        callback({result:200});
    });
};