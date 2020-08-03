var express  = require('express');
var router = express.Router();
var File = require("../models/File");
var Board = require("../models/Board");
var User = require("../models/User");
var Log = require("../models/Log");
var nodeMailer = require('../modules/Mail');
var common = require("../modules/common");

router.post('/getFiles',function(req,res){
    if(req.body.fileLinks){
        var filelink = req.body.fileLinks.split(',');
        var files = [];
        for(let val of filelink){
            files[files.length] = {servername : val};
        }
        File.find({$or:files},function(err,file){
            if(err){
                Log.create({document_name : "File",type:"error",contents:{error:err,content:"입찰목록의 주문 파일 데이터 추출 중 DB 에러"},wdate:Date()});
                console.log(err);
                return res.send({result:"mongo error"});
            }
            var filesInfo = [];
            for(let fileInfo of file){ 
                filesInfo[filesInfo.length] = {
                    'origin' : fileInfo.originname,
                    'server' : fileInfo.servername,
                    'byte' : common.calculateByte(fileInfo.size)
                };
            }
            return res.send({result:"success",data:filesInfo});
        });
    }else{
        return res.send({result:"noFiles"});
    }
});

router.post('/getQnaList',function(req,res){
    // 연결 문의 중 직전 문의 내용 가져오기
    let qnaListsData = [];
    // 부모 노드가 없을 시까지 루프 
    console.log('qnanum : ' + req.body.qnanum);
    console.log("linknum : " + req.body.linknum);
    Board.find({linknum : req.body.linknum},function(err,board){
        if(err){
            Log.create({document_name : "Board",type:"error",contents:{error:err,content:"이전 문의 내용 find 중 DB 에러"},wdate:Date()});
            console.log(err);
            return res.send({result:"mongo error"});
        }
        here : for(let val of board){
            if(val.qnanum == req.body.qnanum){
                break here;
            }
            qnaListsData.push(val);
        }
        console.log("all done");
        res.send({result:"success",data:qnaListsData});
    });        
});

router.post('/getQnaDetail',(req,res)=>{
    // 문의 리스트에서 모든 연결 문의 가져오기
    // 부모 노드가 없을 시까지 루프 
    console.log('qnanum : ' + req.body.qnanum);
    console.log("linknum : " + req.body.linknum);
    Board.find({linknum : req.body.linknum,qnanum:{$ne:req.body.qnanum}},(err,board)=>{
        if(err){
            Log.create({document_name : "Board",type:"error",contents:{error:err,content:"문의리스트 모든 문의내용 find 중 DB 에러"},wdate:Date()});
            console.log(err);
            return res.send({result:"mongo error"});
        }
        console.log("all done");
        res.send({result:"success",data:board});
    }); 
});

router.post('/pd/forceVerified',(req,res)=>{
    console.log('ajax generating...');
    User.findOne({userid:req.body.userid},(err,user)=>{
        if(err){
            Log.create({document_name : "User",type:"error",contents:{error:err,content:"PD 메일 인증을 위한 특정 유저 find 중 DB 에러"},wdate:Date()});
            console.log(err);
            return res.send({result:"mongo error"});
        }
        console.log('userid is ' + user.userid);
        User.updateOne({userid : req.body.userid},{verified:true,mdate:Date(),msubject:req.user.userid,verified_subject:req.user.userid},(err2)=>{
            if(err2){
                Log.create({document_name : "User",type:"error",contents:{error:err,content:"PD 메일 인증 update 중 DB 에러"},wdate:Date()});
                console.log(err2);
                return res.send({result:"mongo error"});
            }
            Log.create({document_name : "User",type:"update",contents:{udate:{verified:true,mdate:Date(),msubject:req.user.userid,verified_subject:req.user.userid},content:"PD 메일 인증 update"},wdate:Date()});
            console.log('done');
            res.send({result:"success"});
        });
       
    });
});

router.post('/pd/accepted',(req,res)=>{
    console.log('ajax generating...');
    User.findOne({userid:req.body.userid},(err,user)=>{
        if(err){
            Log.create({document_name : "User",type:"error",contents:{error:err,content:"PD 메일 인증을 위한 특정 유저 find 중 DB 에러"},wdate:Date()});
            console.log(err);
            return res.send({result:"mongo error"});
        }
        console.log('userid is ' + user.userid);
        User.updateOne({userid : req.body.userid},{accepted:true,mdate:Date(),msubject:req.user.userid,accept_subject:req.user.userid,adate:Date()},(err2)=>{
            if(err2){
                Log.create({document_name : "User",type:"error",contents:{error:err,content:"PD 승인 update 중 DB 에러"},wdate:Date()});
                console.log(err2);
                return res.send({result:"mongo error"});
            }
            Log.create({document_name : "User",type:"update",contents:{udate:{verified:true,mdate:Date(),msubject:req.user.userid,accept_subject:req.user.userid},content:"PD 승인 update"},wdate:Date()});
            console.log('done');
            res.send({result:"success"});
        });
    });
});

router.post('/pd/password',(req,res)=>{
    console.log('ajax generating...');
    console.log('userid is ' + req.body.userid);
    var tempPassword = Math.random().toString(36).slice(2);
    var usr = {
        password : tempPassword,
        tempPassword : tempPassword,
        mdate : Date(),
        msubject : req.user.userid,
    };
    User.findOne({userid:req.body.userid},(err,usr)=>{
        usr.password = tempPassword;
        usr.save((err2)=>{
            if(err2){
                Log.create({document_name : "User",type:"error",contents:{error:err,content:"PD 임시비밀번호 update 중 DB 에러"},wdate:Date()});
                console.log(err2);
                return res.send({result:"mongo error"});
            }
            Log.create({document_name : "User",type:"update",contents:{udate:updateData,content:"PD 임시비밀번호 update"},wdate:Date()});
            console.log('done');
            console.log('mailing...');
            nodeMailer.mailVerification('부품',req.body.email,'임시비밀번호 발급입니다.', "빠른 시일내에 변경 바랍니다. 임시비밀번호 : "+tempPassword);
    
            res.send({result:"success"});
        });
    });  
});

module.exports = router;
