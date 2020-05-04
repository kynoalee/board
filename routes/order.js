var express  = require('express');
var router = express.Router();
var multer = require('multer');
var moment = require('moment');
var nameSetting = require('../config/nameSetting');
var config = require('../config/config');
var util = require('../util'); // 1
var File = require('../models/File');
var Log = require('../models/Log');
var Order = require('../models/Order');

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
});
var order = multer({ storage: storage });

// new order create
router.post('/',order.array('file'),util.isLoggedin, function(req,res,next){
    // File create
    if(req.files.length){
        createFiles(req.files,req,next);
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
            Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"주문 summary create DB 에러"},wdate:Date()});
            req.flash('errors',{});
            return res.redirect('order');
        } else{
            Log.create({document_name : "Summary",type:"create",contents:{summary:summaryObj,content:"주문 summary create"},wdate:Date()});
            Order.Last.create(lastObj,function(err,last){
                if(err){
                    Log.create({document_name : "Last",type:"error",contents:{summary:summaryObj,content:"주문 last create 중 DB 에러"},wdate:Date()});
                    req.flash('errors',{});
                    return res.redirect('order');
                }
                Log.create({document_name : "Last",type:"create",contents:{summary:summaryObj,content:"주문 Last create"},wdate:Date()});
                res.redirect('order/list');
            });
        }
    });
});

// my order list get
router.get('/list',util.isLoggedin,function(req,res){
    // 주문 리스트 상태 값 정의
    var summaryNum = {all : 0};
    var orderDetail = {};
    for(let keyVal in nameSetting.statusName){
        orderDetail["status"+nameSetting.statusName[keyVal].status] = [];
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
        var summary = [];
        for(var ob of arr){      
            let dateOb ={
                orderD : moment(ob.orderdate).format("YYYY-MM-DD"),
                orderH : moment(ob.orderdate).format("HH:mm:ss"),
                modiD : moment(ob.mdate).format("YYYY-MM-DD"),
                modiH : moment(ob.mdate).format("HH:mm:ss")
            };

            let stat = '';
            numberCheck :for(let keyVal in nameSetting.statusName){
                if(ob.status == nameSetting.statusName[keyVal].status){
                    stat = nameSetting.statusName[keyVal].value;
                    summaryNum[keyVal] += 1;
                    summaryNum.all +=1;
                    break numberCheck;
                }
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
                Log.create({document_name : "Last",type:"error",contents:{error:err1,content:""},wdate:Date()});
                console.log(err1);
                req.flash("errors",{message : "DB ERROR"});
                return res.redirect('/');
            }
            Order.Detail.find({orderlink:initialOrdernum},function(err2,detail){
                if(err2){
                    Log.create({document_name : "Detail",type:"error",contents:{error:err2,content:""},wdate:Date()});
                    console.log(err2);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }
                var lastOrderNum = initialOrdernum;
                var lastOrder = [
                    {},
                    {
                        type : "not",
                        filename : 'bidding'
                    },
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
                for(let keyVal in nameSetting.statusName){
                    if(last[0]['summary'+nameSetting.statusName[keyVal].status]){
                        let routerPath =last[0]['filepath'+nameSetting.statusName[keyVal].status].replace("../files","");
                        let fileType = routerPath.split('/');
                        lastOrder[0] = { 
                            summary : last[0]['summary'+nameSetting.statusName[keyVal].status],
                            type : fileType[1],
                            path : routerPath,
                            title : nameSetting.statusName[keyVal].value,
                            filename : ''
                        };
                    }
                }
                // 디테일 링크 설정
                
                
                for(var detailInfo of detail){
                    switch(detailInfo.userclass){
                        case "normal" : detailInfo.userclass = "C"; 
                            break;
                        case "vender" : detailInfo.userclass = "V";
                            break;
                        default : detailInfo.userclass = "PD";
                            break;  
                    }
                    statusCheck : for(let keyVal in nameSetting.statusName){
                        if(detailInfo.status == nameSetting.statusName[keyVal].status){
                            let newObj = {
                                detailnum : detailInfo.order_detailnum,
                                summary : detailInfo.summary,
                                wdate : detailInfo.wdate,
                                userclass : detailInfo.userclass
                            };
                            orderDetail["status"+nameSetting.statusName[keyVal].status].push(newObj);
                            
                            break statusCheck;
                        }
                    }
                }
                // 각 상태 정렬 필요.
                for(let keyVal in nameSetting.statusName){
                    sortArrayTimeDiff(orderDetail['status'+nameSetting.statusName[keyVal].status]);
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

module.exports = router;

// private functions area

function delayFileCreate(creatObj) {
    return new Promise(resolve => 
             setTimeout(() => { 
                File.create(creatObj,function(err,file){
                    if(err){
                        Log.create({document_name : "File",type:"error",contents:{error:error,content:"파일 create 중 DB 에러"},wdate:Date()});
                        console.log(err);
                    }
                    Log.create({document_name : "File",type:"create",contents:{file:file,content:"파일 저장"},wdate:Date()});
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
function sortArrayTimeDiff(array){
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

