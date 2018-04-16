var _pgdb=require('../config/pgDB');
var util=require('util');


function UserInfoModel(obj) {
    this.params=obj;
}
const sql_options={
    SELECTALL:"select * from t_user_info",
    SELECT_ONE:`SELECT * FROM t_user_info WHERE id = ${1}`,

    INSERT:`insert into t_user_info(steam_id ,communityvisibilitystate ,profilestate ,
    personaname ,lastlogoff ,commentpermission ,profileurl,avatar,avatarmedium,avatarfull,
        personastate,realname,primaryclanid,timecreated ,personastateflags,
        loccountrycode,account_id )
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) ;`,

    SELECT_BY_STEAM__ID:`select * from t_user_info where steam_id=$1;`,

    UPDATE_BY_STEAM_ID:`update t_user_info SET steam_id=$1 ,communityvisibilitystate=$2 ,profilestate =$3,
    personaname=$4 ,lastlogoff =$5,commentpermission =$6,profileurl=$7,avatar=$8,avatarmedium=$9,avatarfull=$10,
        personastate=$11,realname=$12,primaryclanid =$13,timecreated=$14 ,personastateflags =$15,
        loccountrycode=$16,account_id=$17 WHERE steam_id =$18;`,

    SELECT_BY_ACCOUNT_ID:`SELECT * FROM t_user_info where account_id=$1;`,

    SELECT_SYNCHRON_BY_ACCOUNT_ID:`SELECT synchron from t_user_info where account_id=$1;`,
    
    UPDATE_SYNCHRON_BY_ACCOUNT_ID:`update t_user_info SET synchron=$1 WHERE account_id=$2;`
};
//继承
util.inherits(UserInfoModel,_pgdb);



UserInfoModel.prototype.selectAll=function (callback) {
    this._query(sql_options.selectAll,[],function (data) {
        callback( data);
    });
}

UserInfoModel.prototype.selectOne=function (callback) {
    this._query(sql_options.selectAll,[1],function (data) {
        callback( data);
    });
}

UserInfoModel.prototype.selectBySteamId=function (params,callback) {
 // console.log(params);
    this._query(sql_options.SELECT_BY_STEAM__ID,params,function (data) {
        callback( data);
    });
}

//steam api
UserInfoModel.prototype.insert=function (params,callback) {
    //console.log(params);
    this._query(sql_options.INSERT,params,function (data) {
        callback( data);
    });
}

UserInfoModel.prototype.update=function (params,callback) {
 //   console.log(params);
    this._query(sql_options.UPDATE_BY_STEAM_ID,params,function (data) {
        callback(data);
    });
}

UserInfoModel.prototype.selectByAccountID=function (params,callback) {
    //   console.log(params);
    this._query(sql_options.SELECT_BY_ACCOUNT_ID,params,function (data) {
        callback(data);
    });
}

/**
 * 查询玩家是否同步过数据
 * @param params
 * @param callback
 */
UserInfoModel.prototype.selectPlayerISSyn=function (params,callback) {
    //   console.log(params);
    this._query(sql_options.SELECT_SYNCHRON_BY_ACCOUNT_ID,params,function (data) {
        callback(data);
    });
}

/**
 * 更新同步情况
 * @param params
 * @param callback
 */
UserInfoModel.prototype.updatePlayerSynchron=function (params,callback) {
    //   console.log(params);
    this._query(sql_options.UPDATE_SYNCHRON_BY_ACCOUNT_ID,params,function (data) {
        callback(data);
    });
}

module.exports=UserInfoModel;