var express  = require('express');
var router = express.Router();
var Board = require('../models/Board');

router.get('/',(req,res)=>{
    var userid = 'imgcom';//req.user.userid;
    var pageNum = req.query.pageNum || 2;
    var boardNum = req.query.boardNum || 7;
    var findObj = {
        userid : userid,
        parents : -1
    };
    Board.find({}).sort({qnanum:1}).skip((pageNum-1)*boardNum).limit(boardNum).exec((err,board)=>{
        if(err){
            Log.create({document_name : "Board",type:"error",contents:{error:err,content:"문의 리스트 생성을 위한 문의 내용 find 중 DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }

        // 전체 갯수 파악
        Board.countDocuments({},(err2,c)=>{
            if(err2){
                Log.create({document_name : "Board",type:"error",contents:{error:err2,content:"문의 리스트 전체 갯수 count 중 DB 에러"},wdate:Date()});
                console.log(err2);
                req.flash("errors",{message : "DB ERROR"});
                return res.redirect('/');
            }
            var boardLists = [];
            var idNum = (pageNum-1)*boardNum+1;
            for(let val of board){
                let tmpObj = {
                    idNum : idNum,
                    test : val.qnanum
                };
                boardLists.push(tmpObj);
                idNum++;
            }
            res.render('qna/qnaList',{
                boardList : boardLists
            });
        });
    });
});

module.exports = router;
