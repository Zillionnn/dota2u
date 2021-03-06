const express = require('express');
const router = express.Router();
const request = require('request');
const cipher = require('../utils/crypto/cipher');
const jwt=require('jsonwebtoken');
const jwtVerify=require('../utils/verifyJWT');


const UserModel = require('../model/User');
const userModel = new UserModel();

const dota2constant = require('dotaconstants');
const async = require('async');

let CONFIG = require('../config/config');

router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/signup', function (req, res, next) {
    let   origin_password = req.body.password,
        nick_name = req.body.nick_name,
        email = req.body.email;

    let password=cipher.encrypted(origin_password);
    console.log(password);
    userModel.signUp([password,nick_name, email], (data) => {
        console.log(`REGISTER CALLBACK>>>`,data);
        if(data.rowCount==1){
            res.send({registerResult: 200});
        }

    });

});

router.post('/check_account',(req,res,next)=>{
    let account = req.body.account;
    console.log(account);
    userModel.selectOneByAccount([account],(data)=>{
        console.log(data);
        if(data.rowCount==0){
            res.send({result:0});
        }else{
            res.send({result:1});
        }

    })
});

router.post('/check_nickname',(req,res,next)=>{
       let    nick_name = req.body.nick_name;
    userModel.selectOneByNickName([nick_name],(data)=>{
        if(data.rowCount==0){
            res.send({result:0});
        }else{
            res.send({result:1});
        }
    })
});

router.post('/check_email',(req,res,next)=>{
   let     email = req.body.email;
    userModel.selectOneByEmail([email],(data)=>{
        if(data.rowCount==0){
            res.send({result:0});
        }else{
            res.send({result:1});
        }
    })
});

router.post('/signin',(req,res,next)=>{
    console.log(req.body);
    let email=req.body.email;
    let origin_pwd=req.body.password;
    console.log(email,typeof origin_pwd);

   // console.log(password);
    userModel.checkPwd([email],function (data) {
      if(data.rowCount==0){
          res.send({ret_code:2,ret_msg:'no email'});
      }else {
          console.log(data);
          let password=cipher.encrypted(origin_pwd);
          let correct_pwd=data.rows[0].password;
          let user_id =data.rows[0].id;
          let nick_name=data.rows[0].nick_name;

          console.log(user_id);
          console.log(password);
          console.log(correct_pwd);
          if(correct_pwd==password){
              //return true;
              console.log('true');
              let payload={
                  id:user_id,
                  email:email,
                  password:correct_pwd
              };
              console.log(data);
              // /second
            let token=jwt.sign(payload,CONFIG.privateKey,{expiresIn:604800});
            console.log(token);
             // let en_token=cipher.encrypted(token);
              userModel.updateToken([token,user_id],(data)=>{
                  //console.log();
              });

              res.send({ret_code:0,ret_msg:token,nick_name:nick_name,user_id:user_id});
            //console.log(token);
          }else{
              res.send({ret_code:2,ret_msg:'wrong password'});
          }
      }
    })
});

router.post('/heart',(req,res,next)=>{

    checkJWT(req).then((data)=>{
        console.log('jwtResult>>',data);
        return data;
    }).then((data)=>{
        if(data){
          res.send({ret_code: 0, message: 'success'});
        }else{
            res.send({ret_code:2,ret_msg:'token Expire  please sign in again'});
        }
    });

});

router.post('/getBindAccount',(req,res,next)=>{
    let id=req.body.user_id;
    console.log(id);
    userModel.selectBindAccountID([id],(data)=>{
        console.log(data);
        let game_account_id=data.rows[0].game_account_id;

        if(game_account_id==null){
            res.send({ret_code:2,ret_msg:'null'});
        }else{
            res.send(game_account_id);
        }

    })
});

/**
 * 绑定game account
 */
router.post('/bindAccount',(req,res,next)=>{
    console.log('/bindAccount');

    checkJWT(req).then((data)=>{
        console.log('jwtResult>>',data);
        return data;
    }).then((data)=>{
        if(data){
            let bind_account=req.body.bind_account;
            let user_id=req.body.user_id;
            userModel.updateGameAccountID([bind_account,user_id],(data)=>{
               // console.log(data);
                res.send({ret_code:0,ret_msg:'bind success'});
            })
        }else{
            res.send({ret_code:2,ret_msg:'token Expire  please sign in again'});
        }
    });

});


function checkJWT(req){
    let token=req.headers.authorization;
    console.log('checkJWT>>>>>>>>>',token);
    return new Promise((resolve,reject)=>{
        jwtVerify.verifyJWT(token,(data)=>{
            console.log('verify  result>>',data);
            if(data.ret_code>=20){
                //res.send(data);
                resolve(false);
            }else if(data.ret_code==0){
                console.log(data);
                resolve(true);
            }
        });
    });

}
module.exports = router;
