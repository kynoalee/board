var express  = require('express');
var router = express.Router();
var File = require("../models/File");
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
            Log.create({document_name : "File",type:"find",contents:{file:file,content:"입찰목록의 주문 파일 데이터 find"},wdate:Date()});
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

module.exports = router;
