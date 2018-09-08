const fs=require('fs');
const request=require('request');
const download=require('download');
const decompress=require('decompress');
const progress=require('request-progress');
const child_process=require('child_process');
const readline=require('readline');
const async=require('async');

let url='http://replay227.valve.net/570/3876545217_1920391580.dem.bz2';
let downloadReply=function(uri, filename, callback) {
    var stream=fs.createWriteStream(filename);
    progress(request(uri)).on('progress',function (state) {

        console.log(state);
    }).pipe(stream).on('close',function (data) {
        console.log(data);
        callback({result:200});
    });
};

let bunzip2=function (filename,callback) {
    console.log(`开始解压`);
    let bunzip2Process=child_process.exec(`java -jar ./bunzip2/BZip2Utils.jar  ${filename}`);
    bunzip2Process.on('exit', function (code) {
        console.log('子进程已退出，退出码 '+code);
        callback({result:'200'});
    });

};

//parseReplay();
 function parseReplay(filename) {
    //TODO  parse replay

        console.log('start parse replay');


    child_process.exec(`java -jar ./parsejar/combatlog.one-jar.jar  0510replay.dem`,  { shell: true, maxBuffer: 10 * 1024 * 1024 },  (err,stdout,stderr)=>{
        if(err){
            console.error(err)
        }
        console.log(stdout);
        const parseStream = readline.createInterface({
            input: process.stdin,
        });
        parseStream.on('line', (e) => {


      console.log('---stdin---',e);
        });
    })
};


let runParseReply=function (url, file_path, callback) {
    async.series([
        function (series_callback) {
            downloadReply(url,file_path,function (data) {
                if(data.result==200){
                    series_callback();
                }

            });
        },
        function (series_callback) {
            bunzip2(file_path,function (data) {
                if(data.result=200){
                    series_callback();
                }
            });

        },
        function (series_callback) {
            parseReplay(file_path);
        }
    ]);
}
/*runParseReply(url,'./0510replay.dem.bz2',function () {

})*/