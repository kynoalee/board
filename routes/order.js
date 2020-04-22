var express  = require('express');
var router = express.Router();
var multer = require('multer');
var moment = require('moment');
var nameSetting = require('../config/nameSetting');
var config = require('../config/config');
var util = require('../util'); // 1
var File = require('../models/File');
var Order = require('../models/Order');
var auth = require('../modules/auth');

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
        let newName = createServerName(file.originalname);
        cb(null, config.file.local+newName.addPath)
    },
    filename: function (req, file, cb) {
        let newName = createServerName(file.originalname);
        cb(null, newName.serverName)
    }
})
var order = multer({ storage: storage })

// new order create
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
    req.body.userclass = req.user.userclass;
    req.body.wdate = Date();
    Order.Detail.find({}).sort({order_detailnum:-1}).findOne().select("order_detailnum").exec(function(err,detail){
        req.body.order_detailnum = detail.order_detailnum+1;

        // 첫 주문일시
        req.body.status = 1;
        Order.Summary.find({}).sort({ordernum:-1}).findOne().select("ordernum").exec(function(err,summary){
            req.body.orderlink = summary.ordernum + 1;
            req.body.ordernum = summary.ordernum + 1;
            req.body.prototypeB = req.body.prototypeB == "true" ?true:false;
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

// my order list get
router.get('/list',util.isLoggedin,function(req,res){
    // test 이후 req.user.userid 
    Order.Summary.find({$or:[{orderid : req.user.userid},{vender : req.user.userid}]},function(err,arr){
        if(!arr.length){
            req.flash("errors",[{message : "주문이 없습니다."}]);
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
            };

            let stat = '';
            switch(ob.status){
                case 1 : stat = nameSetting.statusName.status1;
                    summaryNum.order += 1;
                    summaryNum.all +=1;
                    break;
                case 2 : stat = nameSetting.statusName.status2;
                    summaryNum.ptWork += 1;      
                    summaryNum.all +=1;
                    break;
                case 3 : stat = nameSetting.statusName.status3;
                    summaryNum.ptDeli += 1;
                    summaryNum.all +=1;
                    break;
                case 4 : stat = nameSetting.statusName.status4;
                    summaryNum.work += 1;
                    summaryNum.all +=1;
                    break;
                case 5 : stat = nameSetting.statusName.status5;
                    summaryNum.deli += 1;
                    summaryNum.all +=1;
                    break;
                case 6 : stat = nameSetting.statusName.status6;
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

        // Last Order

        Order.Last.find({ordernum:initialOrdernum},function(err1,last){
            if(err1){
                console.log(err1);
                return res.redirect('/');
            }
            Order.Detail.find({orderlink:initialOrdernum},function(err2,detail){
                if(err2){
                    console.log(err2);
                    return res.redirect('/');
                }
                var lastOrderNum = initialOrdernum;
                var lastOrder = [
                    {},
                    {
                        type : "not",
                        filename : 'ptmaking'
                    },
                    {
                        type : "not",
                        filename : 'ptdeli'
                    },
                    {
                        type : "not",
                        filename : 'making'
                    },
                    {
                        type : "not",
                        filename : 'deli'
                    },
                    {
                        type : "not",
                        filename : 'done'
                    }
                ];
                if(last[0].summary1){
                    let routerPath =last[0].filepath1.replace("../files","");
                    let fileType = routerPath.split('/');
                    lastOrder[0] = { 
                        summary : last[0].summary1,
                        type : fileType[1],
                        path : routerPath,
                        title : nameSetting.statusName.status1,
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
                        title : nameSetting.statusName.status2
                    };
                } 
                if(last[0].summary3){
                    let routerPath =last[0].filepath3.replace("../files","");
                    let fileType = routerPath.split('/');
                    lastOrder[2] = { 
                        summary : last[0].summary3,
                        type : fileType[1],
                        path : routerPath,
                        title : nameSetting.statusName.status3
                    };
                } 
                if(last[0].summary4){
                    let routerPath ='';
                    let fileType = 'not';
                    if(routerPath){
                        routerPath =last[0].filepath4.replace("../files","");
                        fileType = routerPath.split('/');
                    } 
                    lastOrder[3] = { 
                        summary : last[0].summary4,
                        type : fileType[1],
                        path : routerPath,
                        title : nameSetting.statusName.status4
                    };
                } 
                if(last[0].summary5){
                    let routerPath =last[0].filepath5.replace("../files","");
                    let fileType = routerPath.split('/');
                    lastOrder[4] = { 
                        summary : last[0].summary5,
                        type : fileType[1],
                        path : routerPath,
                        title : nameSetting.statusName.status5
                    };
                } 
                if(last[0].summary6){
                    let routerPath =last[0].filepath6.replace("../files","");
                    let fileType = routerPath.split('/');
                    lastOrder[5] = { 
                        summary : last[0].summary6,
                        type : fileType[1],
                        path : routerPath,
                        title : nameSetting.statusName.status6
                    };
                }  
                // 디테일 링크 설정
                var orderDetail = {
                    status1 : [],
                    status2 : [],
                    status3 : [],
                    status4 : [],
                    status5 : [],
                    status6 : []
                };
                for(var detailInfo of detail){
                    switch(detailInfo.userclass){
                        case "normal" : detailInfo.userclass = "C"; 
                            break;
                        case "vender" : detailInfo.userclass = "V";
                            break;
                        default : detailInfo.userclass = "PD";
                            break;  
                    }
                    //FIXME:
                    if(detailInfo.status == 1){
                        let newObj = {
                            detailnum : detailInfo.order_detailnum,
                            summary : detailInfo.summary,
                            wdate : detailInfo.wdate,
                            userclass : detailInfo.userclass
                        };
                        orderDetail.status1[orderDetail.status1.length] = newObj;
                    }
                    if(detailInfo.status == 2){
                        let newObj = {
                            detailnum : detailInfo.order_detailnum,
                            summary : detailInfo.summary,
                            wdate : detailInfo.wdate,
                            userclass : detailInfo.userclass
                        };
                        orderDetail.status2[orderDetail.status2.length] = newObj;
                    }
                    if(detailInfo.status == 3){
                        let newObj = {
                            detailnum : detailInfo.order_detailnum,
                            summary : detailInfo.summary,
                            wdate : detailInfo.wdate,
                            userclass : detailInfo.userclass
                        };
                        orderDetail.status3[orderDetail.status3.length] = newObj;
                    }
                    if(detailInfo.status == 4){
                        let newObj = {
                            detailnum : detailInfo.order_detailnum,
                            summary : detailInfo.summary,
                            wdate : detailInfo.wdate,
                            userclass : detailInfo.userclass
                        };
                        orderDetail.status4[orderDetail.status4.length] = newObj;
                    }
                    if(detailInfo.status == 5){
                        let newObj = {
                            detailnum : detailInfo.order_detailnum,
                            summary : detailInfo.summary,
                            wdate : detailInfo.wdate,
                            userclass : detailInfo.userclass
                        };
                        orderDetail.status5[orderDetail.status5.length] = newObj;
                    }
                    if(detailInfo.status == 6){
                        let newObj = {
                            detailnum : detailInfo.order_detailnum,
                            summary : detailInfo.summary,
                            wdate : detailInfo.wdate,
                            userclass : detailInfo.userclass
                        };
                        orderDetail.status6[orderDetail.status6.length] = newObj;
                    }
                }
                // 각 상태 정렬 필요.
                for(let i = 1; i < 7 ; i++){
                    sortArray(orderDetail['status'+i]);
                }
                res.render('order/list',{
                    summary : summary,
                    lastOrder : lastOrder,
                    lastOrderNum : lastOrderNum,
                    orderDetail : orderDetail,
                    summaryNum : summaryNum,
                    statusName : nameSetting.statusName
                });
            });
        });
    });   
});

// vender order check bid in util.isLoggedIn,
router.get('/bidVenderIn',function(req,res){
     
    Order.Summary.find({vender:{$exists : false},status : 1},function(err,summary){
        if(err){
            console.log(err);
            req.flash("errors",[{message : "DB error"}]);
            return res.redirect("/");
        }
        console.log(summary);
        let summaryList = [];
        for(let obj of summary){
            let dateOb ={
                orderD : moment(obj.orderdate).format("YYYY-MM-DD"),
                orderH : moment(obj.orderdate).format("HH:mm:ss"),
                modiD : moment(obj.mdate).format("YYYY-MM-DD"),
                modiH : moment(obj.mdate).format("HH:mm:ss")
            };

            let tmpSummary = {};
            tmpSummary.ordernum = obj.ordernum;
            tmpSummary.orderdateD = dateOb.orderD;
            tmpSummary.orderdateH = dateOb.orderH;
            tmpSummary.modidateD = dateOb.modiD;
            tmpSummary.modidateH = dateOb.modiH;
            tmpSummary.status = obj.status;
            summaryList[summaryList.length] = tmpSummary;
        }
        console.log(summaryList);
        res.render('order/bidVenderIn',{
            summary : summaryList
        });
    });
   
    
});

module.exports = router;

// private functions area

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

// 어레이 내 시간 차로 정렬
function sortArray(array){
    array.sort(function(a,b){
        if(moment.duration(moment(a.wdate).diff(moment(b.wdate))).asMilliseconds() > 0){
            return 1;
        } else if(moment.duration(moment(a.wdate).diff(moment(b.wdate))).asMilliseconds() < 0){
            return -1;
        } else {
            return 0;
        }
    });
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

