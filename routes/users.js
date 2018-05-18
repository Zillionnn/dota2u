const express = require('express');
const router = express.Router();
const request = require('request');
const cipher = require('../utils/crypto/cipher');
const jwt=require('jsonwebtoken');

const UserModel = require('../model/User');
const userModel = new UserModel();

const dota2constant = require('dotaconstants');
const async = require('async');

let CONFIG = require('../config/config');

router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/signup', function (req, res, next) {
    let session=req.session;
    console.log('session',session);
    let session_email=session.email;

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
          res.send({result:'no email'});
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
              let data=`${email}&&${password}`;
              console.log(data);
            let token=jwt.sign({
             data:data,
                exp:Math.floor(Date.now()/1000)+(60*60)
            },CONFIG.token_keys);
             // let en_token=cipher.encrypted(token);
              userModel.updateToken([token,user_id],(data)=>{
                  //console.log();
              });

              res.send({ret_code:0,ret_msg:token,nick_name:nick_name,user_id:user_id});
            //console.log(token);
          }else{
              res.send({result:'wrong password'});
          }
      }
    })
});

router.post('/heart',(req,res,next)=>{
    let token=req.body.token;
    console.log(token);
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

router.post('/bindAccount',(req,res,next)=>{
    let bind_account=req.body.bind_account;
    let user_id=req.body.user_id;
    userModel.updateGameAccountID([bind_account,user_id],(data)=>{
        console.log(data);
        res.send({ret_code:0,ret_msg:'bind success'});
    })

});
module.exports = router;
