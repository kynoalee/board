var express  = require('express');
var router = express.Router();
var moment = require('moment');
var common = require('../modules/common');
var util = require('../util'); // 1
var File = require('../models/File');
var Bid = require('../models/Bid');
var Board = require('../models/Board');
var Nego = require('../models/Nego');
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
                // 해당 주문번호 입찰했으면 안보이도록
                here : for(let value of summary){
                    if(bid.length != 0){
                        for(let check of bid){ 
                            if(check.ordernum == value.ordernum && check.status =='bidding'){
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

router.get('/bidList',util.isLoggedin,function(req,res){
    var userid = req.user.userid;
    var userclass = req.user.userclass; 
    var findObj = {status : {$ne : 'delete'}};

    // 현재 유저 등급에 맞춰 db 검색
    if(userclass == 'normal'){
        findObj.userid = userid;
    } else if(userclass == 'vender'){
        findObj.vender = userid;
    }

    // 해당 유저가 관여한 모든 입찰 (입찰, 선정, 거절)
    Bid.find(findObj,(err,bid)=>{
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
        var bidDoneList = []; // 입찰된 내역
        var bidnumFindSet = [{linknum : -1}]; // bid가 아예 없을때, null 에러 막기 위한 허구값. 벤더 문의 버튼 여부 확인용  
        for(let val of bid){
            if(val.status.toLowerCase() == 'bidding'){
                // 입찰 상태(대기)인 경우
                let tmpObj = setTmpArrayForBidList(val,userclass);
               
                if(userclass == 'vender'){
                    tmpObj.qnaAble = false; // 벤더 전용. 문의 버튼. 답장해야할 시에 true
                    bidnumFindSet.push({linknum : val.bidnum});
                }

                // post 전용 데이터
                tmpObj.vender = val.vender;
                tmpObj.customer = val.userid;

                biddingList[val.bidnum]=tmpObj;
            } else if(val.status.toLowerCase() == 'select' || val.status.toLowerCase() == 'reject'){
                // 입찰이 된 경우
                let tmpObj = setTmpArrayForBidList(val,userclass);

                tmpObj.status = val.status;

                tmpObj.doneDateD = moment(val.donedate).format("YYYY-MM-DD");
                tmpObj.doneDateH = moment(val.donedate).format("HH:mm:ss");

                bidDoneList.push(tmpObj);
            }
        }

        // 배열 내  undefined 부분 삭제
        // bidnum 순으로 정리함.
        biddingList.sort();
        let max = biddingList.length;
        let num = 0;
        for(let i = 0 ; i < max ; i++){
            if(!biddingList[num]){
                biddingList.pop();
            } else {
                num += 1;
            }
        }
        Board.find({$or:bidnumFindSet,where:"bid",children:-1},(err2,board)=>{
            if(err2){
                Log.create({document_name : "Board",type:"error",contents:{error:err2,content:"각 입찰 관련 qna find DB에러"},wdate:Date()});
                console.log(err2);
                req.flash("errors",{message : "DB ERROR"});
                return res.redirect('/');
            }

            // 각 문의가 있으므로, 문의 버튼 display
            for(let val of board){
                for(let bidding of biddingList){
                    if(bidding.bidnum == val.linknum){
                        bidding.qnaAble = true;
                    }
                }
            }
            
            var negoFind = {status : "accept"};
            if(userclass == 'normal'){
                negoFind.customer = userid;
            } else if(userclass == 'vender'){
                negoFind.vender = userid;
            }
            // 연결된 네고가 있는지 파악
            Nego.find(negoFind,(err3,nego)=>{
                if(err3){
                    Log.create({document_name : "Nego",type:"error",contents:{error:err3,content:"각 입찰 관련 nego find DB에러"},wdate:Date()});
                    console.log(err3);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }
                for(let bidding of biddingList){
                    let tmpArray=[];
                    for(let val of nego){
                        if(bidding.bidnum == val.linknum){
                            let tmpObj = val;
                            tmpObj.mdateFormated = moment(val.mdate).format("YYYY-MM-DD HH:mm:ss");
                            tmpArray.push(tmpObj);
                        }
                    }
                    bidding.nego = tmpArray;
                }

                res.render('bid/bidList',{
                    bidding : biddingList,
                    bidDone : bidDoneList
                });
            });
        });
        
    });
});

router.post('/bidList',function(req,res){
    console.log("bidding process...")
    if(req.user.userclass == 'vender'){
        Log.create({document_name : "Bid",type:"error",contents:{content:"입찰선정과정에 벤더유입됨. 퍼미션 에러"},wdate:Date()});
        req.flash("errors",{message : "no Permission"});
        return res.redirect('/');
    }
    var findObj = {
        ordernum : req.body.ordernum,
    };
    Bid.find(findObj,function(err,bid){
        console.log("ordernum : "+findObj.ordernum + ", find all of linked bid...");
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
            if(bidObj.vender == req.body.vender && bidObj.status == 'bidding'){
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
        console.log("status : " + req.body.status);
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
            
            let updateObj = {
                status : 1,
                vender : req.body.vender,
                mdate : now
            };

            // 오더 데이터에 벤더 데이터 삽입
            Order.Summary.updateOne({ordernum:req.body.ordernum},updateObj,function(err2){
                if(err2){
                    Log.create({document_name : "Summary",type:"error",contents:{error:err2,content:"입찰 선정으로 인한 상태 변화 update 중 DB 에러"},wdate:Date()});
                    console.log(err2);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }
                Log.create({document_name : "Summary",type:"update",contents:{update:updateObj,content:"입찰 선정으로 인한 상태 변화 update"},wdate:Date()});
                
                // 다른 입찰 내역이 있는 경우 Bid 삭제
                if(otherBidIds.length != 0){
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
                return res.redirect('bidList');
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
                if(otherBidIds.length == 0){
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

// 입찰 기본 배열 생성
function setTmpArrayForBidList(val,userclass){
    let tmpObj ={};
    tmpObj.bidnum = val.bidnum;
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