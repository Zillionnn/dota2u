const express = require('express');
const router = express.Router();
const request = require('request');
const cipher = require('../utils/crypto/cipher');

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
module.exports = router;
