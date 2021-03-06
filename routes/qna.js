var express  = require('express');
var router = express.Router();
var multer = require('multer');
var moment = require('moment');
var Board = require('../models/Board');
var Log = require('../models/Log');
var Bid = require('../models/Bid');
var Nego = require('../models/Nego');
var util = require('../util'); // 1
var Upload = require('../modules/upload');

// 파일 서버 업로드 소스
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

var files = multer({ storage: storage });

// 문의 리스트
router.get('/',util.isLoggedin,(req,res)=>{
    const pageNum = req.query.pageNum || 1; // 페이지 포인터
    const boardNum = req.query.boardNum || 10; // 게시물 갯수 
    const blockNum = 5; // 페이징 보여줄 갯수. 
    var findObj = {
        parents : -1
    };
    if(req.user.userclass == 'vender'){
        findObj.vender = req.user.userid;
    } else if(req.user.userclass == 'normal'){
        findObj.customer = req.user.userid;
    }
    Board.find(findObj).sort({qnanum:1}).skip((pageNum-1)*boardNum).limit(boardNum).exec((err,board)=>{
        if(err){
            Log.create({document_name : "Board",type:"error",contents:{error:err,content:"문의 리스트 생성을 위한 문의 내용 find 중 DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }

        // 전체 갯수 파악
        Board.countDocuments(findObj,(err2,c)=>{
            if(err2){
                Log.create({document_name : "Board",type:"error",contents:{error:err2,content:"문의 리스트 전체 갯수 count 중 DB 에러"},wdate:Date()});
                console.log(err2);
                req.flash("errors",{message : "DB ERROR"});
                return res.redirect('/');
            }
            var boardLists = [];
            var last = Math.ceil(c/boardNum); // 완전 마지막 페이지넘버
            var nowBlock = pageNum%blockNum==0 ? parseInt(pageNum/blockNum):parseInt(pageNum/blockNum)+1;
            var EndBlock = last%blockNum==0 ? parseInt(last/blockNum) : parseInt(last/blockNum)+1;
            var goPre = 'display-none';
            var goNext = 'display-none';
            var preNum = 0; // 전 블록 가기 버튼 포인터
            var nextNum = 0; // 다음 블록 가기 버튼 포인터
            var start = (nowBlock-1)*blockNum + 1; // 현재 페이지의 첫 페이지넘버
            var end = start + blockNum - 1; // 현재 페이지의 마지막 페이지넘버
            end = end > last ? last : end;

            // 넘어온 pageNum 유효성 체크
            if(pageNum <= 0 || pageNum > last){
                Log.create({document_name : "Board",type:"error",contents:{pageNum:pageNum,content:"문의 리스트 페이지넘버 유효성 에러"},wdate:Date()});
                console.log("pageNum : " + pageNum + ", 페이지넘버 유효하지 않음.");
                req.flash("errors",{message : "Page ERROR"});
                return res.redirect('/');
            }

            // block 이동 버튼 디스플레이 여부
            if(nowBlock != 1){
                goPre = '';
                preNum = start - 1;
            }
            if(nowBlock!=EndBlock){
                goNext = '';
                nextNum = start + blockNum;
            }

            // 페이징 관련 객체
            var pages = {
                start : start,
                end : end,
                goPre : goPre,
                pre : preNum,
                goNext : goNext,
                next : nextNum,
                last : last,
                nowPage : pageNum
            };
            var idNum = (pageNum-1)*boardNum+1; // 게시물 자체 번호 전체 갯수에 의존.
            for(let val of board){
                let tmpObj = {
                    qnanum : val.qnanum,
                    idNum : idNum,
                    link : val.linknum,
                    summary : val.summary,
                    data : {
                        linknum : val.linknum,
                        userid : val.userid,
                        userclass : val.userclass,
                    }
                };
                // 날짜 포맷 변경
                tmpObj.wdateD = moment(val.wdate).format("YYYY-MM-DD");
                tmpObj.wdateH = moment(val.wdate).format("HH:mm:ss");
                tmpObj.mdateD = moment(val.mdate).format("YYYY-MM-DD");
                tmpObj.mdateH = moment(val.mdate).format("HH:mm:ss");

                // 상태 변경 답변대기중 답변받음 답변완료 / 협상중 협상완료 
                switch(val.status){
                    case 'question' : tmpObj.status = '질문';break;
                    case 'answer' : tmpObj.status = '답변';break;
                    case 'negoQ' : tmpObj.status = '네고질의 질문';break;
                    case 'negoA' : tmpObj.status = '네고질의 답변';break;
                    case 'nego' : tmpObj.status = '네고 신청';break;
                    case 'reNego' : tmpObj.status = '재 네고';break;
                    case 'reject' : tmpObj.status = '변경거절';break;
                    case 'accept' : tmpObj.status = '변경승인';break;
                    default:break;
                }

                if(val.where == 'bid'){
                    tmpObj.where = "입찰";
                }
                var tmpText ='';
                // 변경사항있는지 파악 ( 네고인지 )
                if(val.status == "nego" || val.status == "reNego"){
                    tmpText += '변경 신청';
                    if(val.price){
                        tmpText += " | 가격 "+val.price;
                    }
                    if(val.deadline){
                        tmpText += " | 마감시간 "+val.deadline;
                    }
                }
                // 확정
                if(val.status == "accept"){
                    tmpText += '변경됨';
                    if(val.price){
                        tmpText += " | 가격 "+val.price;
                    }
                    if(val.deadline){
                        tmpText += " | 마감시간 "+val.deadline;
                    }
                }
                
                tmpObj.changedText = tmpText;

                boardLists.push(tmpObj);
                idNum++;
            }
            res.render('qna/qnaList',{
                boardList : boardLists,
                pages : pages
            });
        });
    });
});

// 문의
router.get('/qna',util.isLoggedin,function(req,res){
    var qna = req.flash('qna')||{};
    var errors = req.flash('errors')||{};
    
    // 관련 질문이 있는지 파악
    Board.findOne({linknum : req.query.linknum,where:req.query.where, children : -1},function(err,board){
        if(err){
            Log.create({document_name : "Board",type:"error",contents:{error:err,content:"linknum에 걸린 부모 문의 find DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        var exQnaList = {
            linknum : req.query.linknum,
            exQnaDisplay : "display-none",
            lastQnaDisplay : "display-none",
            requireDisplay : "display-none",
            qnaDisplay : "display-none",
            noNegoDisplay : "display-none",
            negoDisplay : "display-none",
            parents : -1
        };

        if(board){
            // 직전문의가 있는경우
            exQnaList.parents = board.qnanum;
            exQnaList.lastQnaDisplay = '';
            exQnaList.lastData = board;
            exQnaList.wdate = moment(board.wdate).format("YYYY-MM-DD HH:mm:ss");
            exQnaList.mdate = moment(board.mdate).format("YYYY-MM-DD HH:mm:ss");
            // 문의 연결 정보 텍스트화
            if(board.where == 'bid'){
                exQnaList.lastData.whereName = "입찰";
            }
            // 부모 있는지 확인 ( 직전 외 이전 문의 찾기 )
            if(board.parents != -1){
                exQnaList.exQnaDisplay = '';
            }
           
            // 해당 글을 내가 쓰지 않은 경우 
            if(board.userid != req.user.userid){
                // 직전문의가 단순질의의 질문인경우
                if(board.status == "question"){
                    exQnaList.qnaDisplay ='';
                    exQnaList.requireDisplay ='';
                    exQnaList.selectValue = 'answer';
                }

                // 직전문의가 단순질의의 답변인경우
                if(board.status == "answer" ){
                    exQnaList.qnaDisplay ='';
                    exQnaList.noNegoDisplay = '';

                }

                // 네고인경우 , 네고 중 질문 답변 , 재네고인경우
                if(board.status == "nego" || board.status == "negoA" || board.status == "reNego"){
                    exQnaList.qnaDisplay = '';
                    exQnaList.negoDisplay = '';
                }

                // 네고 중 질문할 경우
                if(board.status == "negoQ"){
                    exQnaList.qnaDisplay ='';
                    exQnaList.requireDisplay ='';
                    exQnaList.selectValue = 'negoA';
                }
            } 
            // 승인이나 거절 한 이후 bid 전용
            if(board.status == "accept" || board.status == "reject"){
                if(req.user.userclass != "vender"){
                exQnaList.qnaDisplay = '';
                exQnaList.noNegoDisplay = '';
                }  
            } 
            
        } else{
            // 첫문의
            exQnaList.qnaDisplay = '';
            exQnaList.noNegoDisplay = '';
        }
        // 현재 설정된 가격과 마감시간 등 변경 데이터 검색
        if(req.query.where == 'bid'){
            // 입찰 중 협상 시 bid 데이터 검색
            Bid.findOne({bidnum:req.query.linknum}).select(['userid','vender','detail']).exec((err2,bid)=>{
                if(err2){
                    Log.create({document_name : "Bid",type:"error",contents:{error:err2,content:"현재 입찰관련 상세 데이터 find DB 에러"},wdate:Date()});
                    console.log(err2);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }
                exQnaList.nowData = {
                    price : bid.detail.price , 
                    deadline : bid.detail.deadline,
                    vender : bid.vender,
                    customer : bid.userid
                };
                res.render('qna/qna',{
                    qnaList : exQnaList,
                    qna:qna,
                    errors:errors
                });
            });
        } else {
            // 주문 진행 중 협상
        }
    });
});

// 문의 create
router.post('/qna',util.isLoggedin,files.array('file'),function(req,res,next){
    // 파일 업로드가 있는지 확인
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
    var now = Date();
    // qnanum 생성
    Board.findOne({}).sort({qnanum:-1}).select("qnanum").exec(function(err1,qnanum){
        if(err1){
            Log.create({document_name : "Board",type:"error",contents:{error:err1,content:"마지막 qnanum 가져오는 find DB 에러"},wdate:Date()});
            console.log(err1);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        
        var customer = req.body.customer;
        var vender = req.body.vender;
        // 질의 상태에 따른 처리 시스템상 완전 다른 방향
        // 필수로 넘겨야 하는 정보 저장
        var createData = {
            qnanum : qnanum.qnanum + 1,
            where : req.body.where,
            linknum : req.body.linknum,
            userid : req.user.userid,
            customer : customer,
            vender : vender,
            userclass : req.user.userclass,
            summary : req.body.summary,
            contents : req.body.contents,
            filelinks : req.body.filelink,
            parents : req.body.parents,
            children : -1,
            wdate : now,
            mdate : now
        };

        var negoData = {
            vender : createData.vender,
            customer : createData.customer,
            linkqnanum : createData.qnanum,
            where : createData.where,
            linknum : createData.linknum,
            mdate : now
        };  

        console.log("proccess : "+req.body.qnaKind);
        switch(req.body.qnaKind){
            case 'question':
                createData.nego = null;
                createData.status = "question";
                createQnaDocument(req,res,createData);
                console.log("question done!")
                return res.redirect('/qna');
            case 'answer':
                createData.nego = null;
                createData.status = "answer";
                createQnaDocument(req,res,createData);
                console.log("answer done!")
                return res.redirect('/qna');
            case "negoQ" : 
                Board.findOne({qnanum : req.body.parents},(err2,QnaParents)=>{
                    if(err2){
                    Log.create({document_name : "Board",type:"error",contents:{error:err2,content:"negoQ 입찰 제안 변경 데이터 find DB 에러"},wdate:Date()});
                        console.log(err2);
                        req.flash("errors",{message : "DB ERROR"});
                        return res.redirect('/');
                    }
                    createData.nego = QnaParents.nego;
                    createData.price = QnaParents.price?QnaParents.price:null;
                    createData.deadline = QnaParents.deadline?QnaParents.deadline:null;
                    createData.status = "negoQ";
                    createQnaDocument(req,res,createData);
                    console.log("question during negotiation done!")
                    return res.redirect('/qna');
                });
                break;
            case "negoA" : 
                Board.findOne({qnanum : req.body.parents},(err2,QnaParents)=>{
                    if(err2){
                        Log.create({document_name : "Board",type:"error",contents:{error:err2,content:"negoA 입찰 제안 변경 데이터 find DB 에러"},wdate:Date()});
                        console.log(err2);
                        req.flash("errors",{message : "DB ERROR"});
                        return res.redirect('/');
                    }
                    createData.nego = QnaParents.nego;
                    createData.price = QnaParents.price?QnaParents.price:null;
                    createData.deadline = QnaParents.deadline?QnaParents.deadline:null;
                    createData.status = "negoA";
                    createQnaDocument(req,res,createData);
                    console.log("answer during negotiation done!")
                    return res.redirect('/qna');
                });
            break;
            case 'nego' :
                // 네고 문의 일시
                Bid.findOne({bidnum : req.body.linknum},(err2,bidData)=>{
                    if(err2){
                        Log.create({document_name : "Bid",type:"error",contents:{error:err2,content:"nego시 변경전 데이터를 위한 bid find DB 에러"},wdate:Date()});
                        console.log(err2);
                        req.flash("errors",{message : "DB ERROR"});
                        return res.redirect('/');
                    }
                    Nego.findOne({}).sort({negonum:-1}).select("negonum").exec(function(errN,negonum){
                        if(errN){
                            Log.create({document_name : "Nego",type:"error",contents:{error:errN,content:"마지막 negonum 가져오는 find DB 에러"},wdate:Date()});
                            console.log(errN);
                            req.flash("errors",{message : "DB ERROR"});
                            return res.redirect('/');
                        }
                        createData.nego = negonum.negonum+1;

                        // 추가 정보 입력
                        console.log("Initial negotiation...");
                        if(req.body.price){
                            createData.price = req.body.price;
                        }
                        if(req.body.deadline){
                            createData.deadline = req.body.deadline;
                        }
                        createData.status = "nego";
                        
                        //네고 디비 
                        negoData.status = "negotiating";
                        negoData.wdate = now;
                        negoData.negonum = createData.nego;

                        negoData.bPrice = bidData.detail.price;
                        negoData.bDeadline = bidData.detail.deadline;

                        createQnaDocument(req,res,createData);
                        createNegoDocument(req,res,negoData);
                        return res.redirect('/qna');
                    });
                });
                break;
            case 'reNego' :
                Board.findOne({qnanum : req.body.parents},(err2,QnaParents)=>{
                    if(err2){
                        Log.create({document_name : "Board",type:"error",contents:{error:err2,content:"reNego 입찰 제안 변경 데이터 find DB 에러"},wdate:Date()});
                        console.log(err2);
                        req.flash("errors",{message : "DB ERROR"});
                        return res.redirect('/');
                    }
                    // 네고 문의 일시
                    createData.nego = QnaParents.nego;
                    // 추가 정보 입력
                    console.log("Renegotiation...");
                    createData.price = !req.body.price?QnaParents.price:req.body.price;
                    createData.deadline = !req.body.deadline?QnaParents.deadline:req.body.deadline;
                    createData.status = "reNego";
                    
                    
                    createQnaDocument(req,res,createData);
                    return res.redirect('/qna');
                });
                break;
            case 'reject' :
                Board.findOne({qnanum : req.body.parents},(err2,QnaParents)=>{
                    if(err2){
                        Log.create({document_name : "Board",type:"error",contents:{error:err2,content:"reNego 입찰 제안 변경 데이터 find DB 에러"},wdate:Date()});
                        console.log(err2);
                        req.flash("errors",{message : "DB ERROR"});
                        return res.redirect('/');
                    }
                    let suggestedPrice = QnaParents.price;
                    let suggestedDeadline = QnaParents.deadline;
                    
                    createData.nego = QnaParents.nego;
                    createData.status = "reject";
                    negoData.status = 'reject';

                    if(suggestedPrice){
                        createData.price = suggestedPrice;
                        negoData.aPrice = suggestedPrice;
                    }

                    if(suggestedDeadline){
                        createData.deadline = suggestedDeadline;
                        negoData.aDeadline = suggestedDeadline;
                    }

                    createQnaDocument(req,res,createData);
                    updateNegoDocument(req,res,createData.nego,negoData);
                    return res.redirect('/qna');
                });
                break;
            case 'accept' :
                Board.findOne({qnanum : req.body.parents},(err2,QnaParents)=>{
                    if(err2){
                        Log.create({document_name : "Board",type:"error",contents:{error:err2,content:"입찰 변경내용 수락 변경 데이터 find DB 에러"},wdate:Date()});
                        console.log(err2);
                        req.flash("errors",{message : "DB ERROR"});
                        return res.redirect('/');
                    }
                    let suggestedPrice = QnaParents.price;
                    let suggestedDeadline = QnaParents.deadline;

                    createData.nego = QnaParents.nego;
                                    
                    Bid.findOne({bidnum : QnaParents.linknum},(err3,bid)=>{
                        if(err3){
                            Log.create({document_name : "Bid",type:"error",contents:{error:err3,content:"입찰 기존 내용 find DB 에러"},wdate:Date()});
                            console.log(err3);
                            req.flash("errors",{message : "DB ERROR"});
                            return res.redirect('/');
                        }
                        
                        let updateData = {
                            detail : bid.detail,
                            mdate :now
                        };
                        createData.status = "accept";
                        negoData.status = 'accept';

                        if(suggestedPrice){
                            createData.price = suggestedPrice;
                            negoData.aPrice = suggestedPrice;
                            updateData.detail.price = suggestedPrice;
                        }

                        if(suggestedDeadline){
                            createData.deadline = suggestedDeadline;
                            negoData.aDeadline = suggestedDeadline;
                            updateData.detail.deadline = suggestedDeadline;
                        }
                        createQnaDocument(req,res,createData);
                        updateNegoDocument(req,res,createData.nego,negoData);
                        Bid.updateOne({bidnum : QnaParents.linknum},updateData,(err4)=>{
                            if(err4){
                                Log.create({document_name : "Bid",type:"error",contents:{error:err4,content:"입찰 변경내용 수락 입찰 내용 변경 update DB 에러"},wdate:Date()});
                                console.log(err4);
                                req.flash("errors",{message : "DB ERROR"});
                                return res.redirect('/');
                            }

                            Log.create({document_name : "Bid",type:"update",contents:{update:updateData,content:"입찰 변경내용 수락 입찰 내용 변경 update"},wdate:Date()});
                            return res.redirect('/qna');
                        });
                    });
                    
                });
            break;
            default : break;
        }    
    });
});

async function createQnaDocument(req,res,createObj){
    // 현재 문의 DB 저장
    await Board.create(createObj,function(err){
        if(err){
            Log.create({document_name : "Board",type:"error",contents:{error:err,content:"문의 create DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        Log.create({document_name : "Board",type:"create",contents:{create:createObj,content:"문의 create"},wdate:Date()});
        // 직전 문의가 있을 경우
        if(createObj.parents != -1){
            // 직전 문의에 child 노드 값 update
            Board.findOne({qnanum : createObj.parents},function(err,board){
                if(err){
                    Log.create({document_name : "Board",type:"error",contents:{error:err,content:"부모문의 노드 연결을 위한 부모문의 find DB 에러"},wdate:Date()});
                    console.log(err);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }
                let updateObj = {children : createObj.qnanum ,mdate : createObj.mdate};
                Board.updateOne({qnanum : createObj.parents}, updateObj,function(err2){
                    if(err2){
                        Log.create({document_name : "Board",type:"error",contents:{error:err2,content:"부모문의의 자손 노드 update DB 에러"},wdate:Date()});
                        console.log(err2);
                        req.flash("errors",{message : "DB ERROR"});
                        return res.redirect('/');
                    }
                    Log.create({document_name : "Board",type:"update",contents:{update:updateObj,content:"부모문의의 자손 노드 update"},wdate:Date()});
                });
            });
        }
    });
}

async function createNegoDocument(req,res,createObj){
    // 네고 저장
    Nego.create(createObj,(err)=>{
        if(err){
            Log.create({document_name : "Nego",type:"error",contents:{error:err,content:"네고 create DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        Log.create({document_name : "Nego",type:"create",contents:{create:createObj,content:"네고 create"},wdate:Date()});
    });
}

async function updateNegoDocument(req,res,negonum,updateObj){
    // 확정 네고 저장
    Nego.updateOne({negonum:negonum},updateObj,(err)=>{
        if(err){
            Log.create({document_name : "Nego",type:"error",contents:{error:err,content:"네고 update DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        Log.create({document_name : "Nego",type:"update",contents:{create:updateObj,content:"네고 update"},wdate:Date()});
    });
}

module.exports = router;
