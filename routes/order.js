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
router.get('/list',util.isLoggedin,function(req,res){
    // test 이후 req.user.userid 
    Order.Summary.find({orderid : req.user.userid},function(err,arr){
        if(!arr.length){
            // 주문없을시 처리해야함.TODO:
            return res.redirect('/');
        }
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
                modidate : ob.mdate,
                status : stat,
                memo : ob.customermemo
            }
            summary.push(contents);
        }
        // 주문 번호 순 정렬 
       summary.sort(function(a,b){
            if(moment.duration(moment(a.modidate).diff(moment(b.modidate))).asMilliseconds() < 0){
                return 1;
            } else if(moment.duration(moment(a.modidate).diff(moment(b.modidate))).asMilliseconds() > 0){
                return -1;
            } else {
                return 0;
            }
        });

        var initialOrdernum = req.query.ordernum?req.query.ordernum :summary[0].ordernum;
        summary.sort(function(a,b){
            return a.ordernum < b.ordernum ? -1 : a.ordernum > b. ordernum ? 1 : 0;
        });

        Order.Last.find({ordernum:initialOrdernum},function(err1,last){
            if(err1){
                console.log(err1);
                return res.redirect('/');
            }
            Order.Detail.find({ordernum:initialOrdernum},function(err2,detail){
                if(err2){
                    console.log(err2);
                    return res.redirect('/');
                }
                var lastOrderNum = initialOrdernum;
                var lastOrder = [];
                if(last[0].summary1){
                    let routerPath =last[0].filepath1.replace("../files","");
                    let fileType = routerPath.split('/');
                    lastOrder[0] = { 
                        summary : last[0].summary1,
                        type : fileType[1],
                        path : routerPath,
                        title : "주문",
                        filename : ''
                    };
                }
                if(last[0].summary2){
                    let routerPath =last[0].filepath2.replace("../files","");
                    let fileType = routerPath.split('/');
                    lastOrder[1] = { 
                        summary : last[0].summary2,
                        type : fileType[1],
                        path : routerPath,
                        title : "PT제작"
                    };
                } else {
                    lastOrder[1] ={
                        type : "not",
                        filename : 'ptmaking'
                    };
                }
                if(last[0].summary3){
                    let routerPath =last[0].filepath3.replace("../files","");
                    let fileType = routerPath.split('/');
                    lastOrder[2] = { 
                        summary : last[0].summary3,
                        type : fileType[1],
                        path : routerPath,
                        title : "PT배송"
                    };
                } else {
                    lastOrder[2] ={
                        type : "not",
                        filename : 'ptdeli'
                    };
                }
                if(last[0].summary4){
                    let routerPath =last[0].filepath4.replace("../files","");
                    let fileType = routerPath.split('/');
                    lastOrder[3] = { 
                        summary : last[0].summary4,
                        type : fileType[1],
                        path : routerPath,
                        title : "제작"
                    };
                } else {
                    lastOrder[3] ={
                        type : "not",
                        filename : 'making'
                    };
                }
                if(last[0].summary5){
                    let routerPath =last[0].filepath5.replace("../files","");
                    let fileType = routerPath.split('/');
                    lastOrder[4] = { 
                        summary : last[0].summary5,
                        type : fileType[1],
                        path : routerPath,
                        title : "배송"
                    };
                } else {
                    lastOrder[4] ={
                        type : "not",
                        filename : 'deli'
                    };
                }
                if(last[0].summary6){
                    let routerPath =last[0].filepath6.replace("../files","");
                    let fileType = routerPath.split('/');
                    lastOrder[5] = { 
                        summary : last[0].summary6,
                        type : fileType[1],
                        path : routerPath,
                        title : "확정"
                    };
                }  else {
                    lastOrder[5] ={
                        type : "not",
                        filename : 'done'
                    }
                }
                // 디테일 링크 설정
                var orderDetail = [];
                for(var detailInfo of detail){
                    //FIXME:
                }

                res.render('order/list',{
                    summary : summary,
                    lastOrder : lastOrder,
                    lastOrderNum : lastOrderNum,
                    orderDetail : orderDetail,
                    summaryNum : summaryNum
                });
            });
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
        req.files = [''];
        next();
    }
},
function (req,res,next){
    // OrderDetail create
    req.body.userid = req.user.userid;
    req.body.wdate = Date();
    Order.Detail.find({}).sort({order_detailnum:-1}).findOne().select("order_detailnum").exec(function(err,detail){
        req.body.order_detailnum = detail.order_detailnum+1;

        // 첫 주문일시
        req.body.status = 1;
        Order.Summary.find({}).sort({ordernum:-1}).findOne().select("ordernum").exec(function(err,summary){
            req.body.ordernum = summary.ordernum + 1;
            console.log(req.body);
            Order.Detail.create(req.body,function(err,detail){
                if(err){
                    console.log(err);
                    req.flash('order', req.body);
                    req.flash('errors', util.parseError(err)); // 1
                    return res.redirect('order');
                }
                next();
            });
        });
    });
},
function(req,res){
    // Order Summary, Order last create
    var summaryObj ={
        ordernum : req.body.ordernum,
        orderid : req.body.userid,
        orderdate : req.body.wdate,
        mdate :req.body.wdate,
        status : req.body.status
    };
    var lastObj = {
        ordernum : req.body.ordernum,
        wdate : req.body.wdate,
        mdate : req.body.wdate
    };
    lastObj['filepath'+req.body.status] = req.files[0].path;
    lastObj['summary'+req.body.status] = req.body.summary;

    Order.Summary.create(summaryObj,function(err,summary){
        if(err){
            req.flash('errors',{});
            return res.redirect('order');
        } else{
            Order.Last.create(lastObj,function(err,last){
                if(err){
                    req.flash('errors',{});
                    return res.redirect('order');
                }
                res.redirect('order/list');
            });
        }
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
                resolve(); }, 300) ); 
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
