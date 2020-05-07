var express  = require('express');
var router = express.Router();
var moment = require('moment');
var common = require('../modules/common');
var util = require('../util'); // 1
var File = require('../models/File');
var Bid = require('../models/Bid');
var Log = require('../models/Log');
var Order = require('../models/Order');
var download = require('../modules/download');

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
        Bid.find({vender:req.user.userid},function(err,bid){
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
                    let tmpSummary = setTmpArrayForBidVenderIn(value);
                    if(value.status == 1){
                        tmpSummary.status = "주문";
                    } else {
                        tmpSummary.status = "입찰 중";
                    }
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

                    let tmpSummary = setTmpArrayForBidVenderIn(value);
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
                res.render('bid/bidVenderIn',{
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
    var userid = 'imgcom'; //req.user.userid;
    var userclass = 'normal'; //req.user.userclass; 
    var findObj = {};
    if(userclass == 'normal'){
        findObj.userid = userid;
    } else if(userclass == 'vender'){
        findObj.vender = userid;
    }
    Bid.find(findObj,function(err,bid){
        if(err){
            Log.create({document_name : "Bid",type:"error",contents:{error:err,content:"입찰된 리스트 find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        if(bid.length == 0){
            req.flash("errors",{message : "no Bid"});
            return res.redirect('/');
        }
        var biddingList = []; // 현재 입찰 중인 내역
        var bidDoneList = [];
        for(let val of bid){
            if(val.status.toLowerCase() == 'bidding'){
            
                let tmpObj = setTmpArrayForBidList(val);
                
                // post 전용 데이터
                tmpObj.vender = val.vender;
                tmpObj.customer = val.userid;

                biddingList.push(tmpObj);
            } else{
                let tmpObj = setTmpArrayForBidList(val);

                tmpObj.status = val.status;

                tmpObj.doneDateD = moment(val.donedate).format("YYYY-MM-DD");
                tmpObj.doneDateH = moment(val.donedate).format("HH:mm:ss");

                bidDoneList.push(tmpObj);
            }
        }
    
        res.render('bid/bidList',{
            bidding : biddingList,
            bidDone : bidDoneList
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
    Bid.find(findObj,function(err,bid){
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
                    mdate: now,
                    donedate : now
                };
            }else{
                // 같은 주문번호에 다른 입찰들 체크
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
            Bid.find(fObj,function(err,bid){
                if(err){
                    Log.create({document_name : "Bid",type:"error",contents:{error:err,content:"선정된 입찰리스트와 같은 주문번호를 가진 입찰 내용 find DB에러"},wdate:Date()});
                    console.log(err);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }
                // 다른 입찰 내역이 있는 경우 Bid 삭제
                if(bid.length != 0){
                    Bid.updateOne({$or:otherBidIds},{status:"delete",mdate:now,donedate:now},function(err2){
                        if(err2){
                            Log.create({document_name : "Bid",type:"error",contents:{error:err2,content:"입찰 선정으로 입찰내역 status delete update 중 DB 에러"},wdate:Date()});
                            console.log(err2);
                            req.flash("errors",{message : "DB ERROR"});
                            return res.redirect('/');
                        }
                        Log.create({document_name : "Bid",type:"update",contents:{content:"입찰 선정으로 입찰내역 status delete update"},wdate:Date()});
                    });
                }
                let updateObj = {
                    status : 1,
                    vender : req.body.vender,
                    mdate : now
                };
                Order.Summary.updateOne({ordernum:req.body.ordernum},updateObj,function(err2){
                    if(err2){
                        Log.create({document_name : "Summary",type:"error",contents:{error:err2,content:"입찰 선정으로 인한 상태 변화 update 중 DB 에러"},wdate:Date()});
                        console.log(err2);
                        req.flash("errors",{message : "DB ERROR"});
                        return res.redirect('/');
                    }
                    Log.create({document_name : "Summary",type:"update",contents:{update:updateObj,content:"입찰 선정으로 인한 상태 변화 update"},wdate:Date()});
                    return res.redirect('bidList');
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
            Bid.find(fObj,function(err,bid){
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
                    Order.Summary.updateOne({ordernum:req.body.ordernum},updateObj,function(err2){
                        if(err2){
                            Log.create({document_name : "Summary",type:"error",contents:{error:err2,content:"입찰 거절로 인한 상태 변화 update 중 DB 에러"},wdate:Date()});
                            console.log(err2);
                            req.flash("errors",{message : "DB ERROR"});
                            return res.redirect('/');
                        }
                        Log.create({document_name : "Summary",type:"update",contents:{update:updateObj,content:"입찰 거절로 인한 상태 변화 update"},wdate:Date()});
                        return res.redirect('bidList');
                    });
                } else{
                    let updateObj = {
                        mdate : now
                    };
                    Order.Summary.updateOne({ordernum:req.body.ordernum},updateObj,function(err2){
                        if(err2){
                            Log.create({document_name : "Summary",type:"error",contents:{error:err2,content:"입찰 거절로 인한 mdate update 중 DB 에러"},wdate:Date()});
                            console.log(err2);
                            req.flash("errors",{message : "DB ERROR"});
                            return res.redirect('/');
                        }
                        Log.create({document_name : "Summary",type:"update",contents:{update:updateObj,content:"입찰 거절로 인한 mdate update"},wdate:Date()});
                        return res.redirect('bidList');
                    });
                }
            });            
        }
       
    });
    
});

module.exports = router;

// private functions area

async function workBidDB(obj){
    await Bid.updateOne({_id:obj._id},obj,function(err,bid){
        if(err){
            console.log(err);
            Log.create({document_name : "Bid",type:"error",contents:{error:err,content:"입찰 "+obj.status+" 중 Bid update DB 에러"},wdate:Date()});
            req.flash("errors",{message : "DB Error"});
            return res.redirect('/');
        }
        Log.create({document_name : "Bid",type:"create",contents:{create:obj,content:"입찰 "+obj.status+" 중 Bid update"},wdate:Date()});
    });
}

function setTmpArrayForBidList(val){
    let tmpObj ={};
    tmpObj.ordernum = val.ordernum;
    tmpObj.deadline = val.detail.deadline;
    tmpObj.summary = val.detail.summary;
    tmpObj.description = val.detail.description;

    // 이글에 연결된 나말고 다른 사람
    if(userclass == 'normal'){
        tmpObj.anotherId = val.vender;
    } else if(userclass == 'vender'){
        tmpObj.anotherId = val.userid;
    }

    // 날짜 포맷 변경
    tmpObj.wdateD = moment(val.wdate).format("YYYY-MM-DD");
    tmpObj.wdateH = moment(val.wdate).format("HH:mm:ss");

    // price 포맷 변경
    tmpObj.price = common.numberWithCommas(val.detail.price);
    
    return tmpObj;
}

function setTmpArrayForBidVenderIn(value){
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