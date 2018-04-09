var _pgdb=require('../config/pgDB');
var util=require('util');


function AccountMatchHistoryModel(obj) {
    this.params=obj;
}
const sql_options={
    SELECTALL:"select * from t_account_match_history",
    SELECT_ONE:`SELECT * FROM users WHERE id = ${1}`,
    INSERT:`insert into t_account_match_history(account_id,match_id,match_seq_num,start_time,radiant_team_id,dire_team_id,lobby_type,players)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8) ;`,
    SELECT_BY_MATCH_ID:`select * from t_account_match_history where match_id=$1;`,

    SELECT_PLAYER_100_MATCHES:'SELECT match_id FROM  t_account_match_history WHERE account_id = $1 ORDER BY start_time DESC LIMIT 100;',

    SELECT_PLAYER_MATCHES_LIMIT:'SELECT * FROM t_account_match_history WHERE account_id=$1ORDER BY start_time DESC LIMIT $2;',

    SELECT_BY_ACCOUNT:'SELECT * FROM t_account_match_history WHERE account_id=$1;'
};
//继承
util.inherits(AccountMatchHistoryModel,_pgdb);



AccountMatchHistoryModel.prototype.selectAll=function (callback) {
    this._query(sql_options.selectAll,[],function (data) {
        callback( data);
    });
}

AccountMatchHistoryModel.prototype.selectOne=function (callback) {
    this._query(sql_options.selectAll,[1],function (data) {
        callback( data);
    });
}

AccountMatchHistoryModel.prototype.selectByMatchId=function (params,callback) {
    this._query(sql_options.SELECT_BY_MATCH_ID,params,function (data) {
        callback( data);
    });
}

AccountMatchHistoryModel.prototype.insert=function (params,callback) {
    this._query(sql_options.INSERT,params,function (data) {
        callback( data);
    });
}


AccountMatchHistoryModel.prototype.selectAccount100=function (params, callback) {
    this._query(sql_options.SELECT_PLAYER_100_MATCHES,params,function (data) {
        callback(data);
    })
}

AccountMatchHistoryModel.prototype.selectByPlayerIdAndLimit=function (params,callback) {
    this._query(sql_options.SELECT_PLAYER_MATCHES_LIMIT,params,function (data) {
        callback( data);
    });
}

AccountMatchHistoryModel.prototype.selectByAccount=function (params,callback) {
    this._query(sql_options.SELECT_BY_ACCOUNT,params,function (data) {
        callback( data);
    });
}
module.exports=AccountMatchHistoryModel;