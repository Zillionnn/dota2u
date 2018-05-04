let spawn=require('child_process').spawn;
let process=require('process');
let child_process =require('child_process');

//let task2012=child_process.exec('pm2 start fetchALLMatchDetails.js --watch');
let task2014=child_process.exec('pm2 start fetchALLMatchDetails2014.js --watch');
let task2016=child_process.exec('pm2 start fetchALLMatchDetails2016.js --watch');
let task2017=child_process.exec('pm2 start fetchALLMatchDetails2017.js --watch');
let task201706=child_process.exec('pm2 start fetchALLMatchDetails201706.js --watch');
//let task201801=child_process.exec('pm2 start fetchALLMatchDetails201801.js --watch');


process.exit(0);