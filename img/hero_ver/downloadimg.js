/**
 * Created by Zillion on 2018/3/21.
 */
const request=require('request');
const fs=require('fs');
const dotaconstants=require('dotaconstants');

let heroes=dotaconstants.heroes;
for(var i in heroes){
    let heroname=heroes[i].name.replace("npc_dota_hero_","");
    console.log(heroname);
    let url='http://www.dota2.com.cn/images/heroes/'+heroname+'_vert.jpg';
    let fileName=heroname+'.jpg';
    downloadImg(url,fileName,function () {
        console.log('');
    })
}

function downloadImg(uri, filename, callback) {
    var stream=fs.createWriteStream(filename);
    request(uri).pipe(stream).on('close',callback);
}