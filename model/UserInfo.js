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
        loccountrycode )
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ;`,
    SELECT_BY_STEAM__ID:`select * from t_user_info where steam_id=$1;`
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
    this._query(sql_options.SELECT_BY_STEAM__ID,params,function (data) {
        callback( data);
    });
}

//steam api
UserInfoModel.prototype.insert=function (params,callback) {
    this._query(sql_options.INSERT,params,function (data) {
        callback( data);
    });
}

module.exports=UserInfoModel;