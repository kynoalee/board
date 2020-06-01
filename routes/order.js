var express  = require('express');
var router = express.Router();
var multer = require('multer');
var moment = require('moment');
var nameSetting = require('../config/nameSetting');
var config = require('../config/config');
var util = require('../util'); // 1
var File = require('../models/File');
var Log = require('../models/Log');
var common = require('../modules/common');
var Order = require('../models/Order');
var Upload = require('../modules/upload');
var Download = require('../modules/download');

// order new   
router.get('/',util.isLoggedin,function(req, res){
    var order = req.flash('order')[0] || {};
    var errors = req.flash('errors')[0] || {};
    res.render('order/new',{
        errors:errors,
        order:order
    });
     
});

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
var order = multer({storage:storage});

// new order create
router.post('/',order.array('file'),util.isLoggedin, function(req,res,next){
    // File create
    if(req.files.length){
        Upload.createFiles(req.files,req,next);
    } else{
        console.log("upload with no file");
        req.body.filelink = null;
        req.files = [''];
        next();
    }
},
function (req,res,next){
    // OrderDetail create
    req.body.userid = req.user.userid;
    req.body.userclass = req.user.userclass;
    req.body.wdate = Date();
    Order.Detail.find({}).sort({order_detailnum:-1}).findOne().select("order_detailnum").exec(function(err,detail){
        if(err){
            Log.create({document_name : "Detail",type:"error",contents:{error:err,content:"마지막 order detail num 가져오는 find DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        req.body.order_detailnum = detail.order_detailnum+1;

        // 첫 주문일시
        req.body.status = 1;
        Order.Summary.find({}).sort({ordernum:-1}).findOne().select("ordernum").exec(function(err,summary){
            if(err){
                Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"마지막 order num 가져오는 find DB 에러"},wdate:Date()});
                console.log(err);
                req.flash("errors",{message : "DB ERROR"});
                return res.redirect('/');
            }
            req.body.orderlink = summary.ordernum + 1;
            req.body.ordernum = summary.ordernum + 1;
            req.body.prototypeB = req.body.prototypeB == "true" ?true:false;
            console.log(req.body);
            Order.Detail.create(req.body,function(err,detail){
                if(err){
                    Log.create({document_name : "Detail",type:"error",contents:{error:err,content:"주문 detail create 중 에러"},wdate:Date()});
                    console.log(err);
                    req.flash('order', req.body);
                    req.flash('errors', util.parseError(err)); // 1
                    return res.redirect('order');
                }
                Log.create({document_name : "Detail",type:"create",contents:{order:req.body,content:"주문 디테일 create"},wdate:Date()});
                next();
            });
        });
    });
},
function(req,res){
    // Order Summary create
    var summaryObj ={
        ordernum : req.body.ordernum,
        orderid : req.body.userid,
        orderdate : req.body.wdate,
        mdate :req.body.wdate,
        status : req.body.status
    }
    Order.Summary.create(summaryObj,function(err,summary){
        if(err){
            Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"주문 summary create DB 에러"},wdate:Date()});
            req.flash('errors',{});
            return res.redirect('order');
        } 
        Log.create({document_name : "Summary",type:"create",contents:{summary:summaryObj,content:"주문 summary create"},wdate:Date()});
        res.redirect('order/list');           
    });
});

// my order list get
router.get('/list',util.isLoggedin,function(req,res){
    // 주문 리스트 상태 값 정의
    var summaryNum = {all : 0};   
    for(let keyVal in nameSetting.statusName){
        summaryNum[keyVal] = 0; 
    }

    var findObj = {};
    if(req.user.userclass == "vender"){
        findObj.vender = req.user.userid;
    } else if(req.user.userclass == "normal") {
        findObj.orderid = req.user.userid;
    }

    // test 이후 req.user.userid 
    Order.Summary.find(findObj,function(err,arr){
        if(err){
            Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"주문리스트 주문번호 find 중 DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        if(arr.length ==0){
            req.flash("errors",[{message : "주문이 없습니다."}]);
            return res.redirect('/');
        }

        // 주문요약을 프론트에서 보여줄 배열
        var summary = [];

        // 각 주문요약 데이터 정제
        for(var ob of arr){ 
            
            // 날짜 데이터 포맷팅
            let dateOb ={
                orderD : moment(ob.orderdate).format("YYYY-MM-DD"),
                orderH : moment(ob.orderdate).format("HH:mm:ss"),
                modiD : moment(ob.mdate).format("YYYY-MM-DD"),
                modiH : moment(ob.mdate).format("HH:mm:ss")
            };

            // 상태 한글화
            let stat = '';
            numberCheck :for(let keyVal in nameSetting.statusName){
                if(ob.status == nameSetting.statusName[keyVal].status){
                    stat = nameSetting.statusName[keyVal].value;
                    summaryNum[keyVal] += 1;
                    summaryNum.all +=1;
                    break numberCheck;
                }
            }
            
            // 데이터 객체 묶음
            let contents = {
                ordernum : ob.ordernum,
                orderdateD : dateOb.orderD,
                orderdateH : dateOb.orderH,
                modidateD : dateOb.modiD,
                modidateH : dateOb.modiH,
                modidate : ob.mdate,
                status : stat,
                memo : ob.customermemo
            }
            summary.push(contents);
        }
        
        // 최근 수정 주문 파악 -> 맨처음 오픈시 보여줄 주문번호 파악용
        summary.sort(function(a,b){
            if(moment.duration(moment(a.modidate).diff(moment(b.modidate))).asMilliseconds() < 0){
                return 1;
            } else if(moment.duration(moment(a.modidate).diff(moment(b.modidate))).asMilliseconds() > 0){
                return -1;
            } else {
                return 0;
            }
        });
        
        // 주문상세 
        var orderDetail = {};
        var findOrdernum = req.query.ordernum ? req.query.ordernum : summary[0].ordernum ;
        Order.Detail.findOne({orderlink:findOrdernum}).sort({wdate:-1}).exec((err2,detailArray)=>{
            if(err2){
                Log.create({document_name : "Detail",type:"error",contents:{error:err2,content:"주문상세 find 중 DB 에러"},wdate:Date()});
                console.log(err2);
                req.flash("errors",{message : "DB ERROR"});
                return res.redirect('/');
            }
            orderDetail.ordernum = detailArray.orderlink;
            orderDetail.status = detailArray.status;

            // 상태 한글화
            let stat = '';
            numberCheck2 :for(let keyVal in nameSetting.statusName){
                if(detailArray.status == nameSetting.statusName[keyVal].status){
                    stat = nameSetting.statusName[keyVal].value;
                    break numberCheck2;
                }
            }

            orderDetail.statName = stat;
            orderDetail.userid = detailArray.userid;
            orderDetail.wdate = moment(detailArray.wdate).format("YYYY-MM-DD HH:mm:ss");
            orderDetail.deadline = detailArray.deadline;
            orderDetail.summary = detailArray.summary;


            // 주문 번호 순 정렬 
            summary.sort(function(a,b){
                return a.ordernum < b.ordernum ? -1 : a.ordernum > b. ordernum ? 1 : 0;
            });

            // 관련 업로드된 파일정보 모두 가져오기
            let files = [];
            for(let val of detailArray.filelink){
                files[files.length] = {servername : val};
            }
          

            File.find({$or:files},function(err,file){
                if(err){
                    Log.create({document_name : "File",type:"error",contents:{error:err,content:"주문상세 file find DB에러"},wdate:Date()});
                    console.log(err);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }                // 시각화 파일 정리
                var visualFile  = {
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

                res.render('order/list',{
                    summary : summary,
                    orderDetail : orderDetail,
                    summaryNum : summaryNum,
                    visualFile : visualFile,
                    statusName : nameSetting.statusName
                });
            });
        });
    });   
});

// 주문상세 페이지
router.get('/detail',util.isLoggedin,(req,res)=>{
    var findObj = {ordernum : req.query.ordernum};
    var filesInfo = [];
    Order.Summary.findOne(findObj,function(err,summary){
        if(err){
            Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"주문상세 페이지 find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        // 주문 포괄 데이터
        let summaryData = {
            ordernum : summary.ordernum,
            orderid : summary.orderid,
            vender : summary.vender
        };
        summaryData.wdate = moment(summary.orderdate).format("YYYY-MM-DD HH:mm:ss");
        summaryData.mdate = moment(summary.mdate).format("YYYY-MM-DD HH:mm:ss");

        // 상태값 프론트에 보낼 거 정제
        var statusArray = [];
        for(let i = 0; i < summary.status;i++){
            let statusN = '';
            let loopStat = i+1;
            switch(loopStat){
                case 1 : statusN = nameSetting.statusName['order'].value; 
                    break;
                case 2 : statusN = nameSetting.statusName['bidding'].value; 
                    break;
                case 3 : statusN = nameSetting.statusName['ptWork'].value; 
                    break;
                case 4 : statusN = nameSetting.statusName['ptDeli'].value; 
                    break;
                case 5 : statusN = nameSetting.statusName['work'].value; 
                    break;
                case 6 : statusN = nameSetting.statusName['deli'].value; 
                    break;
                case 7 : statusN = nameSetting.statusName['done'].value; 
                    break;
                default : break;
            }
            statusArray.push(statusN);            
        }
        summaryData.status = statusArray;
        summaryData.getStatus = req.query.status ? req.query.status : summary.status;
        Order.Detail.find({status:summaryData.getStatus,orderlink:req.query.ordernum},function(err1,detail){
            if(err1){
                Log.create({document_name : "Detail",type:"error",contents:{error:err,content:"주문상세 페이지 디테일 find DB에러"},wdate:Date()});
                console.log(err1);
                req.flash("errors",{message : "DB ERROR"});
                return res.redirect('/');
            }
            // 관련 업로드된 파일정보 모두 가져오기
            let files = [{servername:0}];
            for(let details of detail){
                for(let val of details.filelink){
                    files[files.length] = {servername : val};
                }
            }
            File.find({$or:files},function(err,file){
                if(err){
                    Log.create({document_name : "File",type:"error",contents:{error:err,content:"주문상세 페이지 file find DB에러"},wdate:Date()});
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
                switch(summaryData.getStatus){
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
        
                res.render('order/detail',{
                    summaryData:summaryData,
                    filesInfo:filesInfo,
                    details:detail[0],
                    visualFiles : visualFiles,
                    statusName : statusName
                }); 
            });
        });  
    });
});

// 다운로드 라우터
router.get("/detail/:servername",util.isLoggedin,function(req,res){
    let fileName = req.params.servername;
    Download.fileDownload(File,fileName,res);
});

module.exports = router;



