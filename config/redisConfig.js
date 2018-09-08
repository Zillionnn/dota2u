const redis=require('redis');


let options={
  host:'172.16.0.102',
  port:6379
};

const client=redis.createClient(options);


client.on('err',(err)=>{
    console.error(`ERROR  ${err}`);
});

client.set('string key',"string val",redis.print);
client.hset('hash key','hashtest 1','some value',redis.print);
client.hkeys('hash key',(err,replies)=>{
    console.log(replies.length+'replies:');
    replies.forEach((reply ,i )=>{
        console.log(`  ${i}  :   ${reply}`);
    })
    client.quit();
});