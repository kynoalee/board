var express  = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('../config/config');
var Order = require('../models/Order');
var Bid = require('../models/Bid');
var Log = require('../models/Log');
var util = require('../util'); // 1
var Upload = require('../modules/upload');

// 파일 서버 업로드 소스
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let newName = Upload.createServerName(file.originalname);
        cb(null, config.file.local+newName.addPath)
    },
    filename: function (req, file, cb) {
        let newName = Upload.createServerName(file.originalname);
        cb(null, newName.serverName)
    }
});
var files = multer({ storage: storage });

// 입찰하기 위한 내용 입력
router.get('/bid',util.isLoggedin,function(req,res){
    var errors = req.flash("errors")[0] || {};
    var bid = req.flash("bid")[0] || {};
    var ordernum = req.query.ordernum;
    var orderid = req.query.orderid;
    res.render('pop/bid',{
        bid :bid,
        errors : errors,
        ordernum :ordernum,
        orderid : orderid
    });
});


// 입찰 내용 저장 
router.post('/bid',util.isLoggedin,files.array('file'),function(req,res,next){
    if(req.files.length){
        Upload.createFiles(req.files,req,next);
    } else{
        console.log("upload nothing");
        req.body.filelink = null;
        req.files = [''];
        next();
    }
},
function(req,res){
    // req.body.filelink
    var nowDate = Date();

    var summary = {
        status : 2,
        mdate : nowDate
    };
    var bidding = {
        userid : req.body.orderid,
        vender : req.user.userid,
        ordernum : req.body.ordernum,
        detail : {
            price : req.body.price,
            deadline : req.body.deadline,
            filelink : req.body.filelink,
            summary : req.body.summary,
            description : req.body.description
        },
        status : "bidding",
        wdate : nowDate,
        mdate : nowDate
        
    };
    Bid.findOne({}).sort({bidnum:-1}).select("bidnum").exec(function(err1,bidnum){
        if(err1){
            Log.create({document_name : "Summary",type:"error",contents:{error:err1,content:"마지막 bidnum 가져오는 find DB 에러"},wdate:Date()});
            console.log(err1);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        bidding.bidnum = bidnum.bidnum + 1;

        Order.Summary.updateOne({ordernum:req.body.ordernum},summary,function(err,sum){
            if(err) {
                Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"입찰 시도 update DB에러"},wdate:Date()});
                console.log(err);
                req.flash("errors",{message:"DB Error"});
                return res.redirect('/');
            }
            Log.create({document_name : "Summary",type:"update",contents:{summary:sum,content:"입찰 시도 update"},wdate:Date()});
            Bid.create(bidding,function(err2,bid){
                if(err2) {
                    Log.create({document_name : "Bid",type:"error",contents:{error:err2,content:"입찰 시도 create DB에러"},wdate:Date()});
                    req.flash("errors",{message:"DB Error"});
                    return res.redirect('/');
                }
                Log.create({document_name : "Bid",type:"create",contents:{bid : bidding,content:"입찰 시도 create"},wdate:Date()});
                res.redirect('/pop/close');
            });

        });
    });
});

// 팝업 닫기
router.get('/close',function(req,res){
    return res.render('pop/close');
});

module.exports = router;
