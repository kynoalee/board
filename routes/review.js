var express  = require('express');
var router = express.Router();
var multer = require('multer');
var moment = require('moment');
var config = require('../config/config');
var Order = require('../models/Order');
var Review = require('../models/Review');
var File = require("../models/File");
var Log = require('../models/Log');
var util = require('../util'); // 1
var Upload = require('../modules/upload');

// 파일 서버 업로드 소스
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let newName = Upload.createServerName(file.originalname);
        console.log(newName);
        cb(null, config.file.local+newName.addPath);
    },
    filename: function (req, file, cb) {
        let newName = Upload.createServerName(file.originalname);
        console.log(newName);
        cb(null, newName.serverName);
    }
});
var files = multer({ storage: storage });

router.get('/new',util.isLoggedin,(req,res)=>{
    res.render('review/new',{
        ordernum : req.query.ordernum
    });
});

router.post('/new',files.array('file'),util.isLoggedin,(req,res,next)=>{
    if(req.files.length){
        Upload.createFiles(req.files,req,next);
    } else{
        console.log("upload with no file");
        req.body.filelink = null;
        req.files = [''];
        next();
    }
},
(req,res)=>{
    // 리뷰 창조 객체 
    var reviewCreateObj = {
        wdate : Date(),
        ordernum : req.body.ordernum,
        filelink : req.body.filelink,
        userid : req.user.userid,
        summary : req.body.summary,
        description : req.body.description        
    };
    
    // 리뷰 데이터 넣기
    Review.find({}).sort({rnum:-1}).findOne().select("rnum").exec(function(err,reviewnum){
        if(err){
            Log.create({document_name : "Review",type:"error",contents:{error:err,content:"마지막 review num 가져오는 find DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        reviewCreateObj.rnum = reviewnum.rnum+1;

        // 리뷰 생성
        Review.create(reviewCreateObj,(errC)=>{
            if(errC){
                Log.create({document_name : "Review",type:"error",contents:{error:errC,content:"review create DB 에러"},wdate:Date()});
                console.log(errC);
                req.flash("errors",{message : "DB ERROR"});
                return res.redirect('/');
            }
            Log.create({document_name : "Review",type:"Create",contents:{create:reviewCreateObj,content:"review create"},wdate:Date()});
            
            // 주문 summary 업데이트
            Order.Summary.updateOne({ordernum:req.body.ordernum},{mdate:Date(),reviewed:true},(errU)=>{
                if(errU){
                    Log.create({document_name : "Order",type:"error",contents:{error:errU,content:"Order summary update DB 에러"},wdate:Date()});
                    console.log(errU);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }
                Log.create({document_name : "Order",type:"Update",contents:{create:reviewCreateObj,content:"order summary update"},wdate:Date()});
                
                res.redirect('/review/list');
            });
        });
    });
});

router.get('/list',(req,res)=>{

    Review.find({rnum:{$gt:0}},async(err,find)=>{
        var reviewData = [];
        for(val of find){
            let tmpObj = {};
            tmpObj.userid = val.userid[0]
            for(let i = 0 ; i < val.userid.length - 1 ; i++){
                tmpObj.userid += "*";
            }
            tmpObj.wdate = moment(val.wdate).format("YYYY-MM-DD HH:mm:ss");
            tmpObj.summary = val.summary;
            tmpObj.description = val.description;
            // 대표 섬네일. png,jpg,gif,mp4 이외에는 없는걸로 취급. 
            // 관련 업로드된 파일정보 모두 가져오기
            let files = [{servername:0}];
            for(let file of val.filelink){
                files[files.length] = {servername : file};
            }

            await ((array)=>{
                return new Promise((resolve)=>{
                    File.find({$or:array},function(err,file){
                        if(err){
                            Log.create({document_name : "File",type:"error",contents:{error:err,content:"리뷰 file find DB에러"},wdate:Date()});
                            console.log(err);
                            req.flash("errors",{message : "DB ERROR"});
                            return res.redirect('/');
                        }                // 시각화 파일 정리
                        let visualFile  = {
                            type : ''   
                        };
                        fileLoop : for(let fileInfo of file){ 
                            let filetype = fileInfo.filetype.split('/');
                            if(filetype[0] != 'image' && filetype[0] != 'video'){
                                continue fileLoop;
                            }
                            visualFile.type = filetype[0] == 'image' && filetype[1] != 'gif' ? 'image' : filetype[0] == 'image' && filetype[1] == 'gif' ? 'gif' : filetype[0] == 'video' ? 'video' : '';
                            visualFile.fileName = fileInfo.servername;
                            break;
                        }
                        tmpObj.visualFile = visualFile;
                        resolve();
                    });
                });
            })(files);
            
            reviewData.push(tmpObj);
        }
        res.render('review/list',{
            reviewData : reviewData
        }); 
    });
});
module.exports = router;