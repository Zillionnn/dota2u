const jwt=require('jsonwebtoken');

let token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ5IiwiZW1haWwiOiJiQGIuY29tIiwicGFzc3dvcmQiOiIzZTBmYmM0M2Y3ODhkZGZhMDYwZjE0ZmQwY2ZjMDgxZSIsImlhdCI6MTUyNjY5NDE1NSwiZXhwIjoxNTI2Njk0MjE1fQ.97RBQw7MhhxXBlVWMxdFg61ZBFV_IJkuqB0KP3ppKAs";

let config=require('../config/config');
let decode=jwt.decode(token,{complete:true});
console.log(decode);
console.log(new Date(1526694155000).toLocaleString());
console.log(new Date(1526694215000).toLocaleString());

jwt.verify(token,config.token_keys,function (err, decode) {
    if(err){
        console.error(err)
    }else{
        console.log(decode);
    }
});
