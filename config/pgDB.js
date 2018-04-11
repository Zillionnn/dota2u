var pg=require("pg");
const log=require('log4js').getLogger("POSTGRESQL>>");

var config={
    host:'192.168.137.164',
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
                return log.error("查询错误.QueryERROR>> ",err);
            }else{
                callback(result);
            }
        });
    })
};


module.exports=_pgdb;


