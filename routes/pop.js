var express  = require('express');
var router = express.Router();
var multer = require('multer');
var nameSetting = require('../config/nameSetting');
var config = require('../config/config');
var File = require('../models/File');
var Order = require('../models/Order');
var Bid = require('../models/Bid');
var Log = require('../models/Log');
var util = require('../util'); // 1
var download = require('../modules/download');
var Upload = require('../modules/upload');
var common = require("../modules/common");

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

// 주문 정보 전부 보여주는 팝업 
router.get('/detail',util.isLoggedin,function(req, res){
    var findObj = {ordernum : req.query.ordernum};
    if(req.user.userclass == "vender"){
        findObj.vender = req.user.userid;
    } else if(req.user.userclass == "normal") {
        findObj.userid = req.user.userid;
    }
    var filesInfo = [];
    Order.Summary.find(findObj,function(err,summary){
        if(err){
            Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"디테일 팝업 find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        Order.Detail.find({status:req.query.status,orderlink:req.query.ordernum},function(err1,detail){
            if(err1){
                Log.create({document_name : "Detail",type:"error",contents:{error:err,content:"디테일 팝업 디테일 find DB에러"},wdate:Date()});
                console.log(err1);
                req.flash("errors",{message : "DB ERROR"});
                return res.redirect('/');
            }
            // 관련 업로드된 파일정보 모두 가져오기
            let files = [];
            for(let details of detail){
                for(let val of details.filelink){
                    files[files.length] = {servername : val};
                }
            }
            File.find({$or:files},function(err,file){
                if(err){
                    Log.create({document_name : "File",type:"error",contents:{error:err,content:"디테일 팝업 file find DB에러"},wdate:Date()});
                    console.log(err);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }                // 시각화 파일 정리
                var visualFiles  = {
                    images : [],
                    videos : [],
                    gifs :[]
                };
                for(let fileInfo of file){ 
                    let filetype = fileInfo.filetype.split('/');
                    if(filetype[0] == 'image' && filetype[1] != 'gif'){
                        visualFiles.images.push(fileInfo);
                    } else if(filetype[0] == 'image' && filetype[1] == 'gif'){
                        visualFiles.gifs.push(fileInfo);
                    }
                     else if(filetype[0] == 'video'){
                        visualFiles.videos.push(fileInfo);
                    }
                    filesInfo[filesInfo.length] = {
                        'origin' : fileInfo.originname,
                        'server' : fileInfo.servername,
                        'byte' : common.calculateByte(fileInfo.size)
                    };
                }
    
                // 해당 상태값 입력한 정보 최신화
                detail.sort(function(a,b){
                    return a.order_detailnum < b.order_detailnum ? -1 : a.order_detailnum > b. order_detailnum ? 1 : 0;
                });
    
                // 상태 값 시각화
                var statusName;
                switch(req.query.status){
                    case '1' : statusName = nameSetting.statusName.status1; 
                        break;
                    case '2' : statusName = nameSetting.statusName.status2; 
                        break;
                    case '3' : statusName = nameSetting.statusName.status3; 
                        break;
                    case '4' : statusName = nameSetting.statusName.status4; 
                        break;
                    case '5' : statusName = nameSetting.statusName.status5; 
                        break;
                    case '6' : statusName = nameSetting.statusName.status6; 
                        break;
                    default : break;
                }
    
                // qna 설정
    
                res.render('pop/detail',{
                    filesInfo:filesInfo,
                    details:detail[0],
                    visualFiles : visualFiles,
                    statusName : statusName
                }); 
            });
        });  
    });
    
});

router.get("/detail/:servername",util.isLoggedin,function(req,res){
    let fileName = req.params.servername;
    download.fileDownload(File,fileName,res);
});

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
