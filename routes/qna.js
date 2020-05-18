var express  = require('express');
var router = express.Router();
var moment = require('moment');
var Board = require('../models/Board');
var Log = require('../models/Log');

router.get('/',(req,res)=>{
    const userid = 'imgcom';//req.user.userid;
    const pageNum = req.query.pageNum || 1; // 페이지 포인터
    const boardNum = req.query.boardNum || 10; // 게시물 갯수 
    const blockNum = 5; // 페이징 보여줄 갯수. 
    const findObj = {
        userid : userid,
        children : -1
    };
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

module.exports = router;
