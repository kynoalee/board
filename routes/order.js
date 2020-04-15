var express  = require('express');
var router = express.Router();
var multer = require('multer');
var moment = require('moment');
var config = require('../config/config')
var util = require('../util'); // 1
var File = require('../models/File');
var Order = require('../models/Order');
var auth = require('../modules/auth');

// Index   
router.get('/',util.isLoggedin,function(req, res){
    var order = req.flash('order')[0] || {};
    var errors = req.flash('errors')[0] || {};
    res.render('order/new',{
        errors:errors,
        order:order
    });
     
});

// list get
router.get('/list',function(req,res){
    // test 이후 req.user.userid 
    Order.Summary.find({orderid : "imgcom"},function(err,arr){
        var summary = [];
        var summaryNum = {
            order : 0,
            ptWork : 0,
            ptDeli : 0,
            work : 0,
            deli : 0,
            done : 0,
            all : 0
        };
        for(var ob of arr){      
            let dateOb ={
                orderD : moment(ob.orderdate).format("YYYY-MM-DD"),
                orderH : moment(ob.orderdate).format("HH:mm:ss"),
                modiD : moment(ob.mdate).format("YYYY-MM-DD"),
                modiH : moment(ob.mdate).format("HH:mm:ss")
            }

            let stat = '';
            switch(ob.status){
                case 1 : stat = "주문";
                    summaryNum.order += 1;
                    summaryNum.all +=1;
                    break;
                case 2 : stat = "PT 제작";
                    summaryNum.ptWork += 1;      
                    summaryNum.all +=1;
                    break;
                case 3 : stat = "PT 배송";
                    summaryNum.ptDeli += 1;
                    summaryNum.all +=1;
                    break;
                case 4 : stat = "제작";
                    summaryNum.work += 1;
                    summaryNum.all +=1;
                    break;
                case 5 : stat = "배송";
                    summaryNum.deli += 1;
                    summaryNum.all +=1;
                    break;
                case 6 : stat = "확정";
                    summaryNum.done += 1;
                    summaryNum.all +=1;
                    break;
                    default:break;
            }

            let contents = {
                ordernum : ob.ordernum,
                orderdateD : dateOb.orderD,
                orderdateH : dateOb.orderH,
                modidateD : dateOb.modiD,
                modidateH : dateOb.modiH,
                status : stat,
                memo : ob.customermemo
            }
            summary.push(contents);
        }
        // 주문 번호 순 정렬 
        summary.sort(function(a,b){
            return a.ordernum < b.ordernum ? -1 : a.ordernum > b. ordernum ? 1 : 0;
        });

        res.render('order/list',{
            summary : summary,
            summaryNum : summaryNum
        });
    });
   
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let newName = createServerName(file.originalname);
        cb(null, config.fileUrl+newName.addPath)
    },
    filename: function (req, file, cb) {
        let newName = createServerName(file.originalname);
        cb(null, newName.serverName)
    }
})
var order = multer({ storage: storage })

// create
router.post('/',order.array('file'),util.isLoggedin, function(req,res,next){
    // File create
    if(req.files.length){
        createFiles(req.files,req,next);
    } else{
        console.log("upload nothing");
        req.body.filelink = null;
        next();
    }
},
function (req,res){
    // OrderDetail create
    Order.Detail.find({}).sort({order_detailnum:-1}).findOne().select("order_detailnum").exec(function(err,detail){
        req.body.order_detailnum = detail.order_detailnum+1;
        console.log(req.body.order_detailnum);
        Order.Detail.create(req.body,function(err,detail){
            if(err){
                console.log(err);
                req.flash('order', req.body);
                req.flash('errors', util.parseError(err)); // 1
                return res.redirect('order');
            }
            res.redirect('order');
        });
    });
});

function delayFileCreate(creatObj) {
    return new Promise(resolve => 
             setTimeout(() => { 
                File.create(creatObj,function(err,file){
                    console.log(creatObj);
                    if(err){
                        console.log(err);
                    }
                    console.log("done");
                });                    
                resolve(); }, 1000) ); 
}

async function createFiles(array,req,next) {
    var fileLink =[];
    for(const fileInfo of array){
        let creatObj ={
            originname:fileInfo.originalname,
            servername:fileInfo.filename,
            filepath:fileInfo.path.replace("../",""),
            uploadid:req.user.userid,
            filetype:fileInfo.mimetype,
            udate:Date()
        };
        await delayFileCreate(creatObj);
        fileLink[fileLink.length] = fileInfo.filename;
  }
  req.body.filelink = fileLink;
  next();
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
        addPaht = 'videos/';
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
