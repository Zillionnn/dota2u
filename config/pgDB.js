var pg=require("pg");
const log=require('log4js').getLogger("POSTGRESQL>>");

var config={
    host:'192.168.137.51',
    user:"postgres",
    database:"dota2u",
    password:"123456",
    port:"5432",

    max:20,
    idleTimeoutMillis:3000, // 连接最大空闲时间 3s
}

var pool=new pg.Pool(config);

function _pgdb() {

}

_pgdb.prototype._connect=function (callback) {
    //console.log('connecting..');
    pool.connect((err,client,done)=>{
        if(err){
            console.error("连接错误connect error",err);
            return log.error("连接错误connect error",err);
        }
        callback({client:client,done:done});

    });
};

_pgdb.prototype._query=function (sql, params, callback) {
    //console.log("queying");
    if(typeof  params=='function'){
        callback=params;
        params=[];
    }
    if(!params){
        params=[];
    }
    if(!sql){
        let err="sql is empty";
        callback(err);
    }

     this._connect((result)=>{
   //     console.log(result);
        var client=result.client;
        var done=result.done;
        client.query(sql,params,function (err, result) {
            done();
            if(err){
                console.error("查询错误.QueryERROR>> ",err);
                log.error("查询错误.SQL_PARAMS>> ",params);
                return log.error("查询错误.QueryERROR>> ",err);

            }else{
                callback(result);
            }
        });
    })
};

/*
client.query(sql,params,function (err, result) {
    try {
        done();
        callback(result);
    }catch (e) {
        console.error("查询错误.QueryERROR>> ",err);
        log.error("查询错误.SQL_PARAMS>> ",params);
        log.error("查询错误.QueryERROR>> ",err);
        setTimeout(()=>{
            _pgdb.prototype._query(sql,params,callback)
        },10000);

    }

});*/

module.exports=_pgdb;


