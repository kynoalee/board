var express  = require('express');
var router = express.Router();
var multer = require('multer');
var moment = require('moment');
var common = require('../modules/common');
var nameSetting = require('../config/nameSetting');
var config = require('../config/config');
var util = require('../util'); // 1
var File = require('../models/File');
var Bid = require('../models/Bid');
var Log = require('../models/Log');
var Order = require('../models/Order');
var download = require('../modules/download');

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
        fundObj.userid = req.user.userid;
    }

    // test 이후 req.user.userid 
    Order.Summary.find(findObj,function(err,arr){
        if(err){
            Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"주문리스트 주문번호 find 중 DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        if(!arr.length){
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
                    sortArray(orderDetail['status'+nameSetting.statusName[keyVal].status]);
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
router.get('/bidVenderIn',util.isLoggedin,function(req,res){
    if(req.user.userclass != "vender"){
        req.flash("errors",{message : "NO Permission"});
        return res.redirect('/');
    }
    Order.Summary.find({vender:{$exists : false},$or:[{status : 1},{status : 2}]},function(err,summary){
        if(err){
            Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"입찰목록 주문 목록 find 중 DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",[{message : "DB error"}]);
            return res.redirect("/");
        }
        Bid.Ing.find({vender:req.user.userid},function(err,bid){
            if(err){
                Log.create({document_name : "Bid",type:"error",contents:{error:err,content:"입찰 내역 find 중 DB 에러"},wdate:Date()});
                console.log(err);
                req.flash("errors",{message : "DB ERROR"});
                return res.redirect('/');
            }
            var orderlinks = [];
            var summaryList = {};
            // 해당 주문번호 입찰했으면 안보이도록
            if(bid.length == 0 ){
                for(let value of summary){
                    let tmpSummary = setTmpArray(value);
                    summaryList[value.ordernum] = tmpSummary;
                    orderlinks[orderlinks.length] = { orderlink : value.ordernum};
                } 
            } else{
                here : for(let value of summary){
                    if(bid.length != 0){
                        for(let check of bid){ 
                            if(check.ordernum == value.ordernum){
                                continue here;
                            } 
                        }
                    }

                    let tmpSummary = setTmpArray(value);
                    summaryList[value.ordernum] = tmpSummary;
                    orderlinks[orderlinks.length] = { orderlink : value.ordernum};
                }
            }
            Order.Detail.find({$or:orderlinks},function(err2,detail){
                if(err2){
                    Log.create({document_name : "Detail",type:"error",contents:{error:err2,content:"입찰목록 detail find 중 DB 에러"},wdate:Date()});
                    console.log(err2);
                    req.flash("errors",[{message : "DB error"}]);
                    return res.redirect("/");
                }
                for(let obj of detail){
                    summaryList[obj.orderlink].detail = obj;
                }
                res.render('order/bidVenderIn',{
                    summary : summaryList
                });                         
            });  
        });
              
    });
});

// file download
router.get('/bidVenderIn/:servername',util.isLoggedin,function(req,res){
    var fileName = req.params.servername;
    download.fileDownload(File,fileName,res);
});

router.get('/bidList',function(req,res){
    var userid = 'imgcom';
    var userclass = 'normal'; // req.user.userclass;
    var findObj = {};
    if(userclass == 'normal'){
        findObj.userid = userid;
    } else if(userclass == 'vender'){
        findObj.vender = userid;
    }
    Bid.Ing.find(findObj,function(err,bid){
        if(err){
            Log.create({document_name : "Bid",type:"error",contents:{error:err,content:"입찰된 리스트 find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }        
        var biddingList = [];
        for(let val of bid){
            let tmpObj = {};
            tmpObj.ordernum = val.ordernum;
            tmpObj.deadline = val.detail.deadline;
            tmpObj.summary = val.detail.summary;
            tmpObj.description = val.detail.description;

            // 이글에 연결된 나말고 다른 사람
            if(userclass == 'normal'){
                tmpObj.userid = val.vender;
            } else if(userclass == 'vender'){
                tmpObj.userid = val.userid;
            }
            tmpObj.vender = val.vender;

            // 날짜 포맷 변경
            tmpObj.wdateD = moment(val.wdate).format("YYYY-MM-DD");
            tmpObj.wdateH = moment(val.wdate).format("HH:mm:ss");

            // price 포맷 변경
            tmpObj.price = common.numberWithCommas(val.detail.price);
            biddingList.push(tmpObj);
        }
        Bid.Done.find({findObj},function(err2,bidDone){
            if(err2){
                Log.create({document_name : "BidDone",type:"error",contents:{error:err2,content:"입찰된 리스트 find DB에러"},wdate:Date()});
                console.log(err2);
                req.flash("errors",{message : "DB ERROR"});
                return res.redirect('/');
            }     
            var bidDoneList = [];
            for(let val of bidDone){
                let tmpObj = {};
                tmpObj.ordernum = val.ordernum;
                tmpObj.deadline = val.detail.deadline;
                tmpObj.summary = val.detail.summary;
                tmpObj.description = val.detail.description;
                tmpObj.status = val.status;

                // 이글에 연결된 나말고 다른 사람
                if(userclass == 'normal'){
                    tmpObj.userid = val.vender;
                } else if(userclass == 'vender'){
                    tmpObj.userid = val.userid;
                }
    
                // 날짜 포맷 변경
                tmpObj.wdateD = moment(val.wdate).format("YYYY-MM-DD");
                tmpObj.wdateH = moment(val.wdate).format("HH:mm:ss");
                tmpObj.doneDateD = moment(val.donedate).format("YYYY-MM-DD");
                tmpObj.doneDateH = moment(val.donedate).format("HH:mm:ss");

                // price 포맷 변경
                tmpObj.price = common.numberWithCommas(val.detail.price);
                bidDoneList.push(tmpObj);
            }
            res.render('order/bidList',{
                bidding : biddingList,
                bidDone : bidDoneList
            });
        });
        
    });
});

router.post('/bidList',function(req,res){
    if(req.user.userclass == 'vender'){
        Log.create({document_name : "Bid",type:"error",contents:{content:"입찰선정과정에 벤더유입됨. 퍼미션 에러"},wdate:Date()});
        req.flash("errors",{message : "no Permission"});
        return res.redirect('/');
    }
    var findObj = {
        ordernum : req.body.ordernum,

    };
    Bid.Ing.find(findObj,function(err,bid){
        if(err){
            Log.create({document_name : "Bid",type:"error",contents:{error:err,content:"입찰 리스트 find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        let now = Date();
        let otherBidIds = [];
        let bidDoneObj = {};
        for(let bidObj of bid){
            if(bidObj.vender == req.body.vender){
                bidDoneObj = {
                    _id : bidObj._id,
                    ordernum : req.body.ordernum,
                    userid : req.body.userid,
                    vender : req.body.vender,
                    detail : bidObj.detail,
                    wdate : bidObj.wdate,
                    donedate : now
                };
            }else{
                otherBidIds.push({_id:bidObj._id});
            }
        }

        if(req.body.status == "select"){
            bidDoneObj.status = "select";

            // 해당 입찰 건 bid done으로 create dont upsert, delete Bid
            workBidDB(bidDoneObj);

            // 다른 입찰이 있는 지 확인
            // 있다면 Bid 삭제, Summary status 변경 vender 삽입
            let fObj = {ordernum : req.body.ordernum};
            if(otherBidIds.length != 0){
                fObj['$or'] = otherBidIds;
            }
            Bid.Ing.find(fObj,function(err,bid){
                if(err){
                    Log.create({document_name : "Bid",type:"error",contents:{error:err,content:"선정된 입찰리스트와 같은 주문번호를 가진 입찰 내용 find DB에러"},wdate:Date()});
                    console.log(err);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }
                // 다른 입찰 내역이 있는 경우 Bid 삭제
                if(bid.length != 0){
                    Bid.Ing.remove({$or:otherBidIds},function(err2){
                        if(err2){
                            Log.create({document_name : "Bid",type:"error",contents:{error:err2,content:"입찰 선정으로 입찰내역 remove 중 DB 에러"},wdate:Date()});
                            console.log(err2);
                            req.flash("errors",{message : "DB ERROR"});
                            return res.redirect('/');
                        }
                        Log.create({document_name : "Bid",type:"remove",contents:{content:"입찰 선정으로 입찰내역 remove"},wdate:Date()});
                    });
                }
                let updateObj = {
                    status : 1,
                    vender : req.body.vender,
                    mdate : now
                };
                Order.Summary.update({ordernum:req.body.ordernum},updateObj,function(err2){
                    if(err2){
                        Log.create({document_name : "Summary",type:"error",contents:{error:err2,content:"입찰 선정으로 인한 상태 변화 update 중 DB 에러"},wdate:Date()});
                        console.log(err2);
                        req.flash("errors",{message : "DB ERROR"});
                        return res.redirect('/');
                    }
                    Log.create({document_name : "Summary",type:"update",contents:{update:updateObj,content:"입찰 선정으로 인한 상태 변화 update"},wdate:Date()});
                    return res.redirect('order/bidList');
                });
            });

        } else if(req.body.status == "reject"){
            bidDoneObj.status = "reject";

            // 해당 입찰 건 bid done으로 create dont upsert , delete Bid
            workBidDB(bidDoneObj);

            // 해당 주문번호에 걸린 입찰이 또 있는지 확인
            // 주문번호입찰 있는지 여부에 따라 status 변경 , 여부에 상관없이 mdate 변경
            let fObj = {ordernum : req.body.ordernum};
            if(otherBidIds.length != 0){
                fObj['$or'] = otherBidIds;
            }
            Bid.Ing.find(fObj,function(err,bid){
                if(err){
                    Log.create({document_name : "Bid",type:"error",contents:{error:err,content:"거절된 입찰리스트와 같은 주문번호를 가진 입찰 내용 find DB에러"},wdate:Date()});
                    console.log(err);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }
                // 다른 입찰 내역이 없는 경우 status 2 -> 1 
                if(bid.length == 0){
                    let updateObj = {
                        status : 1,
                        mdate : now
                    };
                    Order.Summary.update({ordernum:req.body.ordernum},updateObj,function(err2){
                        if(err2){
                            Log.create({document_name : "Summary",type:"error",contents:{error:err2,content:"입찰 거절로 인한 상태 변화 update 중 DB 에러"},wdate:Date()});
                            console.log(err2);
                            req.flash("errors",{message : "DB ERROR"});
                            return res.redirect('/');
                        }
                        Log.create({document_name : "Summary",type:"update",contents:{update:updateObj,content:"입찰 거절로 인한 상태 변화 update"},wdate:Date()});
                        return res.redirect('order/bidList');
                    });
                } else{
                    let updateObj = {
                        mdate : now
                    };
                    Order.Summary.update({ordernum:req.body.ordernum},updateObj,function(err2){
                        if(err2){
                            Log.create({document_name : "Summary",type:"error",contents:{error:err2,content:"입찰 거절로 인한 mdate update 중 DB 에러"},wdate:Date()});
                            console.log(err2);
                            req.flash("errors",{message : "DB ERROR"});
                            return res.redirect('/');
                        }
                        Log.create({document_name : "Summary",type:"update",contents:{update:updateObj,content:"입찰 거절로 인한 mdate update"},wdate:Date()});
                        return res.redirect('order/bidList');
                    });
                }
            });            
        }
       
    });
    
});

module.exports = router;

// private functions area

async function workBidDB(obj){
    await Bid.Done.create(obj,function(err,bidDone){
        if(err){
            console.log(err);
            Log.create({document_name : "BidDone",type:"error",contents:{error:err,content:"입찰 "+obj.status+" 중 BidDone create DB 에러"},wdate:Date()});
            req.flash("errors",{message : "DB Error"});
            return res.redirect('/');
        }
        Log.create({document_name : "BidDone",type:"create",contents:{error:err,content:"입찰 "+obj.status+" 중 BidDone create"},wdate:Date()});
    });
    await Bid.Ing.remove({_id:obj._id},function(err,bid){
        if(err){
            console.log(err);
            Log.create({document_name : "Bid",type:"error",contents:{error:err,content:"입찰 "+obj.status+" 중 BidDone remove DB 에러"},wdate:Date()});
            req.flash("errors",{message : "DB Error"});
            return res.redirect('/');
        }
        Log.create({document_name : "BidDone",type:"remove",contents:{content:"입찰 "+obj.status+" 중 BidDone remove"},wdate:Date()});
    });
}

function setTmpArray(value){
    let dateOb ={
        orderD : moment(value.orderdate).format("YYYY-MM-DD"),
        orderH : moment(value.orderdate).format("HH:mm:ss"),
        modiD : moment(value.mdate).format("YYYY-MM-DD"),
        modiH : moment(value.mdate).format("HH:mm:ss")
    };

    let tmpSummary = {};
    tmpSummary.ordernum = value.ordernum;
    tmpSummary.orderid = value.orderid;
    tmpSummary.orderdateD = dateOb.orderD;
    tmpSummary.orderdateH = dateOb.orderH;
    tmpSummary.modidateD = dateOb.modiD;
    tmpSummary.modidateH = dateOb.modiH;
    
    return tmpSummary;
}

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

