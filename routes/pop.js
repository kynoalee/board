var express  = require('express');
var router = express.Router();
var multer = require('multer');
var moment = require('moment');
var nameSetting = require('../config/nameSetting');
var config = require('../config/config');
var File = require('../models/File');
var Order = require('../models/Order');
var Bid = require('../models/Bid');
var Log = require('../models/Log');
var util = require('../util'); // 1
var download = require('../modules/download');
var common = require("../modules/common");

router.get('/detail',util.isLoggedin,function(req, res){
    var findObj = {ordernum : req.query.ordernum};
    if(req.user.userclass == "vender"){
        findObj.vender = req.user.userid;
    } else if(req.user.userclass == "normal") {
        fundObj.userid = req.user.userid;
    }
    var filesInfo = [];
    Order.Summary.find(findObj,function(err,summary){
        if(err){
            Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"디테일 팝업 find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        Log.create({document_name : "Summary",type:"find",contents:{summary:summary,content:"디테일 팝업 summary find"},wdate:Date()});
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
            Log.create({document_name : "Detail",type:"find",contents:{detail:detail,content:"디테일 팝업 detail find"},wdate:Date()});
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
                Log.create({document_name : "File",type:"find",contents:{file:file,content:"디테일 팝업 file find"},wdate:Date()});
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
                switch(request.status){
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
var bid = multer({ storage: storage });

router.post('/bid',util.isLoggedin,bid.array('file'),function(req,res,next){
    if(req.files.length){
        createFiles(req.files,req,next);
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
    }
    var bidding = {
        ordernum : req.body.ordernum,
        vender : req.user.userid,
        userid : req.body.orderid,
        detail : {
            price : req.body.price,
            deadline : req.body.deadline,
            filelink : req.body.filelink,
            summary : req.body.summary,
            description : req.body.description
        },
        wdate : nowDate
    }
    Order.Summary.updateOne({ordernum:req.body.ordernum},summary,function(err,sum){
        if(err) {
            Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"입찰 시도 update DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message:"DB Error"});
            return res.redirect('/');
        }
        console.log(sum);
        bidding.userid = sum.userid;
        Log.create({document_name : "Summary",type:"update",contents:{summary:sum,content:"입찰 시도 update"},wdate:Date()});
        Bid.updateOne({ordernum:req.body.ordernum,userid : req.user.userid},bidding,{upsert:true},function(err2,bid){
            if(err2) {
                Log.create({document_name : "Bid",type:"error",contents:{error:err,content:"입찰 시도 upsert DB에러"},wdate:Date()});
                console.log(err2);
                req.flash("errors",{message:"DB Error"});
                return res.redirect('/');
            }
            Log.create({document_name : "Bid",type:"upsert",contents:{error:err,content:"입찰 시도 upsert"},wdate:Date()});
            res.redirect('/pop/close');
        });

    });
}
);

router.get('/close',function(req,res){
    res.render('pop/close');
});

function delayFileCreate(creatObj) {
    return new Promise(resolve => 
             setTimeout(() => { 
                File.create(creatObj,function(err,file){
                    if(err){
                        Log.create({document_name : "File",type:"error",contents:{error:err,content:"파일정보 find DB에러"},wdate:Date()});
                        console.log(err);
                    }
                    console.log("done");
                });                    
                resolve(); }, 300) ); 
}

async function createFiles(array,req,next) {
    var fileLink =[];
    for(let fileInfo of array){
        let creatObj ={
            originname:fileInfo.originalname,
            servername:fileInfo.filename,
            filepath:fileInfo.path.replace("../",""),
            uploadid:req.user.userid,
            filetype:fileInfo.mimetype,
            size:fileInfo.size,
            udate:Date()
        };
        await delayFileCreate(creatObj);
        fileLink[fileLink.length] = fileInfo.filename;
  }
  req.body.filelink = fileLink;
  next();
}

function calculateByte(byte){
    let calByte = 0;
    let stringByte = 'Byte';
    if(byte>=1000 && byte < 1000000){
        calByte = (byte / 1000).toFixed(2);
        stringByte = "KB";
    } else if(byte >1000000){
        calByte = (byte / 1000000).toFixed(2);
        stringByte = "MB";
    } else {
        calByte = byte;
    }
    return calByte+stringByte;
}
// 업로드 파일 서버 저장용 이름 설정
function createServerName(origin){
    let originSplitName = origin.split('.');
    let extension = originSplitName.pop();
    let serverName = "file";
    let newServerName =moment().format('YYMMDDHHmmssSSS_')+serverName+'.'+extension;
    let addPath = 'etc/';
    if(/(txt|text)/.test(extension)) {
        addPath = 'texts/';
    }
    else if(/(jpeg|jpg|png)/.test(extension)) {
        addPath = 'images/';
    }
    else if(/(mp4|avi|mkv)/.test(extension)) {
        addPath = 'videos/';
    }
    else if(/(gif)/.test(extension)) {
        addPath = 'gif/';
    }
    else if(/(pdf)/.test(extension)) {
        addPath = 'pdf/';
    }
    return {serverName : newServerName, extension : extension,addPath : addPath};
}

module.exports = router;
