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

    SELECT_ONE_USER_BY_EMAIL:`SELECT id from t_user where email=$1;`

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


module.exports=User;