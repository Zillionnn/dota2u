var _pgdb=require('../config/pgDB');
var util=require('util');


function MatchHistoryModel(obj) {
this.params=obj;
}
const sql_options={
   SELECTALL:"select * from t_match_history",
    selectOne:`SELECT * FROM users WHERE id = ${1}`,
    INSERT:`insert into t_match_history(match_id,match_seq_num,start_time,radiant_team_id,dire_team_id,lobby_type,players)
     VALUES($1,$2,$3,$4,$5,$6,$7) ;`,
    SELECT_BY_MATCH_ID:`select * from t_match_history where match_id=$1;`
};
//继承
util.inherits(MatchHistoryModel,_pgdb);



MatchHistoryModel.prototype.selectAll=function (callback) {
    this._query(sql_options.selectAll,[],function (data) {
        callback( data);
    });
}

MatchHistoryModel.prototype.selectOne=function (callback) {
    this._query(sql_options.selectAll,[1],function (data) {
        callback( data);
    });
}

MatchHistoryModel.prototype.selectByMatchId=function (params,callback) {
    this._query(sql_options.SELECT_BY_MATCH_ID,params,function (data) {
        callback( data);
    });
}

MatchHistoryModel.prototype.insert=function (params,callback) {
    this._query(sql_options.INSERT,params,function (data) {
        callback( data);
    });
}

module.exports=MatchHistoryModel;