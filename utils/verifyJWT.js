const jwt=require('jsonwebtoken');
const CONFIG=require('../config/config');
const UserModel = require('../model/User');
const userModel = new UserModel();

exports.verifyJWT=function (token,callback) {
    jwt.verify(token,CONFIG.privateKey,function (err, decode) {
        if(err){
            if(err.name=='TokenExpiredError'){
                console.error(err.name);
                callback({ret_code:20,ret_msg:'token expired'});
            }else {
                callback({ret_code:21,ret_msg:'unknown error'});
            }
        }else{
            //console.log(decode);
            let jwtEmail=decode.email;
            let jwtPwd=decode.password;
            userModel.checkPwd([jwtEmail],(data)=>{
                if(data.rowCount==0){
                    callback({ret_code:23,ret_msg:'no email'});
                }else {
                    let correct_pwd = data.rows[0].password;
                    if (correct_pwd == jwtPwd) {
                        callback({ret_code:0,ret_msg:'token access'});
                    }else{
                        callback({ret_code:24,ret_msg:'error pwd'});
                    }
                }
            });

        }
    });

};