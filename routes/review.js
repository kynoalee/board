var express  = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('../config/config');
var Order = require('../models/Order');
var Review = require('../models/Review');
var Log = require('../models/Log');
var util = require('../util'); // 1
var Upload = require('../modules/upload');

// 파일 서버 업로드 소스
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let newName = createServerName(file.originalname);
        cb(null, config.file.local+newName.addPath)
    },
    filename: function (req, file, cb) {
        let newName = createServerName(file.originalname);
        cb(null, newName.serverName)
    }
});
var files = multer({ storage: storage });
router.get('/',(req,res)=>{
    res.redirect('/');
});
router.get('/new',util.isLoggedin,(req,res)=>{
    res.render('review/new',{
        ordernum : req.query.ordernum
    });
});

router.post('/new',files.array(),util.isLoggedin,(req,res,next)=>{
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
    // 리뷰 데이터 넣기
    Review.find({}).sort({rnum:-1}).findOne().select("rnum").exec(function(err,reviewnum){
        if(err){
            Log.create({document_name : "Review",type:"error",contents:{error:err,content:"마지막 review num 가져오는 find DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
    });
    Review.find({},(er,f)=>{
        res.redirect('/review/list');
    });
});

router.get('/list',(req,res)=>{

    res.render('review/list'); 
});
module.exports = router;