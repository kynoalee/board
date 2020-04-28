var User = require('../models/User');
var Log = require('../models/Log');
var crypto = require('crypto');

// 토큰 생성
var generateToken = function(){
    var keyOne=crypto.randomBytes(256).toString('hex').substr(100, 5);
    var keyTwo=crypto.randomBytes(256).toString('base64').substr(50, 5);
    var keyForVerify=keyOne+keyTwo;
    return keyForVerify;
}

// 토큰 DB 업데이트
var updateToken = async function(email,newToken){   
    await User.updateOne({email:email},{verifytoken : newToken});
    await Log.create({document_name : "User",type:"update",contents:{email:email,token:newToken,content:"이메일 인증 토큰 생성"},wdate:Date()});
}

// 인증
var verifyToken = async function(email,token){
    await User.findOne({email:email})
    .select({verifytoken:1,verified:1})
    .exec(function(err,user){
        console.log("check token...");
        if(err) {
            Log.create({document_name : "User",type:"error",contents:{error:err,content:"이메일 인증 토큰 확인 중 DB 에러"},wdate:Date()});
            console.log(err+'11');
            return false
        };
        if(!user) {
            console.log('test');
            return false;
        }
        if(token != user.verifytoken) {
            console.log('다름');
            return false;
        }
        // DB 키값 저장
        (async()=>{
            await User.updateOne({email:email},{$set:{verified : true,verifytoken:null}});
            await Log.create({document_name : "User",type:"update",contents:{email:email,content:"이메일 인증 완료"},wdate:Date()});
            await console.log("DB updated!");
            return true;
        })();
    });
}

module.exports.generateToken = generateToken;
module.exports.updateToken = updateToken;
module.exports.verifyToken = verifyToken;
