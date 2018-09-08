/*
for(var i=0;i<13;i++){
    console.log(`delete from t_match_detail_main_2014${i}  where id not in (select min(id) from t_match_detail_main group by match_id);`);
}
*/


function f1() {
    var result=new Array();
    for(let i =0;i<10;i++){
        result[i]=function (num) {
            return function () {
                return num;
            };
        }(i);
        console.log(result[i]);
    }

    return result;
}


function f2() {

    let resultObj=new Object();
    resultObj.isR=false;
    console.log(resultObj);
    let isR=resultObj.isR;
    let _self=this;
    let a=setInterval(()=>{
        console.log(resultObj);
        if(resultObj.isR==false){
            console.log(1);
           // f2();
        }else{
            console.log('oh it is true');
            return _self;
        }
    },3000);

    setTimeout(function () {
        //clearTimeout(a);
        console.log(2);
        resultObj.isR=true;
    },5000);


}

///f2();

function dblLinear(n) {
    var ai = 0, bi = 0, eq = 0;
    var sequence = [1];
    while (ai + bi < n + eq) {
        var y = 2 * sequence[ai] + 1;
        var z = 3 * sequence[bi] + 1;
        if (y < z) { sequence.push(y); ai++; }
        else if (y > z) { sequence.push(z); bi++; }
        else { sequence.push(y); ai++; bi++; eq++; }
    }
    return sequence.pop();
}
//console.log(dblLinear(56551));
const object1={
    a:1,
    b:2,
    c:3
};
const object3={
    i:'name'
}

const object2=Object.assign({c:4,d:5},object1,object3);
//console.log(object2);

let tock=Math.floor(Date.now() / 1000) + (60 * 60)
1526559977
3600000
console.log(tock);



