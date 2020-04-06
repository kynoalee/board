var User = require('../models/User');
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
}

// 인증
var verifyToken = async function(email,token){
    await User.findOne({email:email})
    .select({verifytoken:1,verified:1})
    .exec(function(err,user){
        console.log("check token...");
        if(err) {
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
            await console.log("DB updated!");
            return true;
        })();
    });
}

module.exports.generateToken = generateToken;
module.exports.updateToken = updateToken;
module.exports.verifyToken = verifyToken;
