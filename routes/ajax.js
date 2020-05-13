var express  = require('express');
var router = express.Router();
var File = require("../models/File");
var Board = require("../models/Board");
var Log = require("../models/Log");
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

module.exports = router;
