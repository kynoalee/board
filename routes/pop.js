var express  = require('express');
var router = express.Router();
var multer = require('multer');
var moment = require('moment');
var nameSetting = require('../config/nameSetting');
var config = require('../config/config');
var File = require('../models/File');
var Order = require('../models/Order');
var Bid = require('../models/Bid');
var Board = require('../models/Board');
var Nego = require('../models/Nego');
var Log = require('../models/Log');
var util = require('../util'); // 1
var download = require('../modules/download');
var common = require("../modules/common");

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

// 주문 정보 전부 보여주는 팝업 
router.get('/detail',util.isLoggedin,function(req, res){
    var findObj = {ordernum : req.query.ordernum};
    if(req.user.userclass == "vender"){
        findObj.vender = req.user.userid;
    } else if(req.user.userclass == "normal") {
        findObj.userid = req.user.userid;
    }
    var filesInfo = [];
    Order.Summary.find(findObj,function(err,summary){
        if(err){
            Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"디테일 팝업 find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
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
                switch(req.query.status){
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

// 입찰하기 위한 내용 입력
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


// 입찰 내용 저장 
router.post('/bid',util.isLoggedin,files.array('file'),function(req,res,next){
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
    };
    var bidding = {
        userid : req.body.orderid,
        vender : req.user.userid,
        ordernum : req.body.ordernum,
        detail : {
            price : req.body.price,
            deadline : req.body.deadline,
            filelink : req.body.filelink,
            summary : req.body.summary,
            description : req.body.description
        },
        status : "bidding",
        wdate : nowDate,
        mdate : nowDate
        
    };
    Bid.findOne({}).sort({bidnum:-1}).select("bidnum").exec(function(err1,bidnum){
        if(err1){
            Log.create({document_name : "Summary",type:"error",contents:{error:err1,content:"마지막 bidnum 가져오는 find DB 에러"},wdate:Date()});
            console.log(err1);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        bidding.bidnum = bidnum.bidnum + 1;

        Order.Summary.updateOne({ordernum:req.body.ordernum},summary,function(err,sum){
            if(err) {
                Log.create({document_name : "Summary",type:"error",contents:{error:err,content:"입찰 시도 update DB에러"},wdate:Date()});
                console.log(err);
                req.flash("errors",{message:"DB Error"});
                return res.redirect('/');
            }
            Log.create({document_name : "Summary",type:"update",contents:{summary:sum,content:"입찰 시도 update"},wdate:Date()});
            Bid.create(bidding,function(err2,bid){
                if(err2) {
                    Log.create({document_name : "Bid",type:"error",contents:{error:err2,content:"입찰 시도 create DB에러"},wdate:Date()});
                    req.flash("errors",{message:"DB Error"});
                    return res.redirect('/');
                }
                Log.create({document_name : "Bid",type:"create",contents:{bid : bidding,content:"입찰 시도 create"},wdate:Date()});
                res.redirect('/pop/close');
            });

        });
    });
});

// 문의 팝업
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
            Bid.findOne({bidnum:req.query.linknum}).select('detail').exec((err2,bid)=>{
                if(err2){
                    Log.create({document_name : "Bid",type:"error",contents:{error:err2,content:"현재 입찰관련 상세 데이터 find DB 에러"},wdate:Date()});
                    console.log(err2);
                    req.flash("errors",{message : "DB ERROR"});
                    return res.redirect('/');
                }
                exQnaList.nowData = {price : bid.detail.price , deadline : bid.detail.deadline};

                res.render('pop/qna',{
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
        createFiles(req.files,req,next);
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
        // 질의 상태에 따른 처리 시스템상 완전 다른 방향
        // 필수로 넘겨야 하는 정보 저장
        var createData = {
            qnanum : qnanum.qnanum + 1,
            where : req.body.where,
            linknum : req.body.linknum,
            userid : req.user.userid,
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
                return res.redirect('/pop/close');
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
                    return res.redirect('/pop/close');
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
                    return res.redirect('/pop/close');
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
                return res.redirect('/pop/close');

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
                            return res.redirect('/pop/close');
                        });
                    });
                    
                });
            break;
            default : break;
        }
    });
});

// 팝업 닫기
router.get('/close',function(req,res){
    return res.render('pop/close');
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
