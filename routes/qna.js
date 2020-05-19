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
        let newName = createServerName(file.originalname);
        cb(null, config.file.local+newName.addPath)
    },
    filename: function (req, file, cb) {
        let newName = createServerName(file.originalname);
        cb(null, newName.serverName)
    }
});

var files = multer({ storage: storage });

// 문의 리스트
router.get('/',(req,res)=>{
    const pageNum = req.query.pageNum || 1; // 페이지 포인터
    const boardNum = req.query.boardNum || 10; // 게시물 갯수 
    const blockNum = 5; // 페이징 보여줄 갯수. 
    var findObj = {
        parents : -1
    };
    if(req.user.userclass == 'vender'){
        findObj.customer = req.user.userid;
    } else if(req.user.userclass == 'normal'){
        findObj.vender = req.user.userid;
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
                    idNum : idNum,
                    link : val.linknum,
                    summary : val.summary,
                    data : {
                        linknum : val.linknum,
                        userid : val.userid,
                        userclass : val.userclass,
                        where : val.where
                    }
                };
                // 날짜 포맷 변경
                tmpObj.wdateD = moment(val.wdate).format("YYYY-MM-DD");
                tmpObj.wdateH = moment(val.wdate).format("HH:mm:ss");
                tmpObj.mdateD = moment(val.mdate).format("YYYY-MM-DD");
                tmpObj.mdateH = moment(val.mdate).format("HH:mm:ss");

                // 상태 변경 답변대기중 답변받음 답변완료 / 협상중 협상완료 
                

                if(val.where == 'bid'){
                    tmpObj.where = "입찰";
                }
                
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
    var userid = req.query.userid;
    var userclass = req.query.userclass;
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
            qnaDisplay : "",
            noNegoDisplay : "",
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

            // 직전문의를 쓴 문의자가 현재 나였는지 파악 그리고 네고가 끝났는지 파악
            if(userid == board.userid && userclass == board.userclass && !board.negoConfirm){
                exQnaList.qnaDisplay = 'display-none';
            }

            // 부모 있는지 확인 ( 직전 외 이전 문의 찾기 )
            if(board.parents != -1){
                exQnaList.exQnaDisplay = '';
            }
            
            // 직전 문의가 네고일시
            if(board.nego && !board.negoConfirm){
                exQnaList.noNegoDisplay = 'display-none';
                exQnaList.negoDisplay = '';
            }

            if(board.status == 'negoqna'){
                exQnaList.noNegoDisplay = 'display-none';
                exQnaList.negoDisplay = 'display-none';
                exQnaList.requireDisplay = 'negoqna';
            }
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
                console.log(exQnaList);
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
        console.log("proccess : "+req.body.qnaKind);
        switch(req.body.qnaKind){
            case 'qna':
                createData.nego = false;
                createQnaDocument(req,res,createData);
                return res.redirect('/qna');
            case "negoqna" : 
                Board.findOne({qnanum : req.body.parents},(err2,QnaParents)=>{
                    if(err2){
                        Log.create({document_name : "Board",type:"error",contents:{error:err2,content:"입찰 제안 변경 데이터 find DB 에러"},wdate:Date()});
                        console.log(err2);
                        req.flash("errors",{message : "DB ERROR"});
                        return res.redirect('/');
                    }
                    createData.nego = true;
                    createData.price = QnaParents.price?QnaParents.price:null;
                    createData.deadline = QnaParents.deadline?QnaParents.deadline:null;
                    createData.status = "negoqna";
                    createQnaDocument(req,res,createData);
                    return res.redirect('/qna');
                });
            break;
            case 'nego' :
                Board.findOne({qnanum : req.body.parents},(err2,QnaParents)=>{
                    if(err2){
                        Log.create({document_name : "Board",type:"error",contents:{error:err2,content:"입찰 제안 변경 데이터 find DB 에러"},wdate:Date()});
                        console.log(err2);
                        req.flash("errors",{message : "DB ERROR"});
                        return res.redirect('/');
                    }
                    // 네고 문의 일시
                    createData.nego = true;
                    // 추가 정보 입력
                    if(!QnaParents){
                        // 초기 협상
                        console.log("Initial negotiation...");
                        if(req.body.price){
                            createData.price = req.body.price;
                        }
                        if(req.body.deadline){
                            createData.deadline = req.body.deadline;
                        }
                    } else {
                        // 재협상시
                        console.log("Renegotiation...");
                        createData.price = QnaParents.price?QnaParents.price:null;
                        createData.deadline = QnaParents.deadline?QnaParents.deadline:null;
                    }

                    createData.negoConfirm = false;

                    createQnaDocument(req,res,createData);
                    return res.redirect('/qna');
                });
            break;
            case 'reject' :
                createData.nego = true;
                createData.negoConfirm = true;
                let negoData = {
                    linkqnanum : createData.qnanum,
                    where : createData.where,
                    linknum : createData.linknum,

                    status : 'reject',
                    wdate : now
                };

                createQnaDocument(req,res,createData);
                createNegoDocument(req,res,negoData);
                return res.redirect('/qna');

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

                    createData.nego = true;
                    createData.negoConfirm = true;
                    let negoData = {
                        linkqnanum : createData.qnanum,
                        where : createData.where,
                        linknum : createData.linknum,
    
                        status : 'accept',
                        wdate : now
                    };

                    
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

                        if(suggestedPrice){
                            createData.price = suggestedPrice;
                            negoData.price = suggestedPrice;
                            updateData.detail.price = suggestedPrice;
                        }

                        if(suggestedDeadline){
                            createData.deadline = suggestedDeadline;
                            negoData.deadline = suggestedDeadline;
                            updateData.detail.deadline = suggestedDeadline;
                        }
                        createQnaDocument(req,res,createData);
                        createNegoDocument(req,res,negoData);
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
    // 확정 네고 저장
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

module.exports = router;
