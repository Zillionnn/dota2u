var _pgdb=require('../config/pgDB');
var util=require('util');


function User(obj) {
    this.params=obj;
}
const sql_options={
    SING_UP:`INSERT INTO t_user(
	password,  nick_name, email)
	VALUES ($1, $2, $3);`,

    SELECT_ONE_USER_BY_ACCOUNT_NAME:`SELECT id from t_user where account_name=$1;`,

    SELECT_ONE_USER_BY_NICK_NAME:`SELECT id from t_user where nick_name=$1;`,

    SELECT_ONE_USER_BY_EMAIL:`SELECT id from t_user where email=$1;`,

    SELECT_PWD_WHERE_EMAIL:`SELECT id,password,nick_name from t_user where email=$1;`,

    UPDATE_TOKEN_BY_ID:`UPDATE t_user
	SET   token=$1
	WHERE  id=$2;`
};
//继承
util.inherits(User,_pgdb);

/**
 * register user
 * */
User.prototype.signUp=function(params,callback){
    this._query(sql_options.SING_UP,params,(data)=>{
        callback(data);
    })
};

User.prototype.selectOneByAccount=function(params,callback){
    this._query(sql_options.SELECT_ONE_USER_BY_ACCOUNT_NAME,params,(data)=>{
        callback(data);
    })
};

User.prototype.selectOneByNickName=function(params,callback){
    this._query(sql_options.SELECT_ONE_USER_BY_NICK_NAME,params, (data)=>{
        callback(data);
    })
};

User.prototype.selectOneByEmail=function(params,callback){
    this._query(sql_options.SELECT_ONE_USER_BY_EMAIL,params,(data)=>{
        callback(data);
    })
};

User.prototype.checkPwd=function(params,callback){
    this._query(sql_options.SELECT_PWD_WHERE_EMAIL,params,(data)=>{
        callback(data);
    })
}

User.prototype.updateToken=function(params,callback){
    this._query(sql_options.UPDATE_TOKEN_BY_ID,params,(data)=>{
        callback(data);
    })
}


module.exports=User;