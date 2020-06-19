var express  = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('../config/config');
var Order = require('../models/Order');
var Log = require('../models/Log');
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
router.get('/',(req,res)=>{
    console.log('test');
    res.redirect('/');
});
router.get('/new',util.isLoggedin,(req,res)=>{

    res.render('review/new',{
        ordernum : req.query.ordernum
    });
});

router.get('/list',(req,res)=>{

    res.render('review/list'); 
});
module.exports = router;