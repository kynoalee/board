var moment = require('moment');
var express  = require('express');
var router = express.Router();
var util = require('./pdUtil');
var User = require('../../models/User');
var Log = require('../../models/Log');

router.get('/',util.isLogIn,function(req,res){
     return res.redirect('/pd/user/customer');
 });

router.get('/customer',util.isLogIn,function(req,res){
    var menu1= new util.menu("사용자 정보 조회/수정","","selected");
    var menu2= new util.menu("벤더 정보 조회/수정","/pd/user/vender","");
    var menu3= new util.menu("PD 정보 조회/수정","/pd/user/admin","");

    User.find({userclass:'normal'},(err,users)=>{
        if(err){
            Log.create({document_name : "User",type:"error",contents:{error:err,content:"pd customer find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/pd');
        }
        for(var user of users){
            user.wdateFormated = moment(user.wdate).format("YYYY-MM-DD HH:mm:ss");
            user.mdateFormated = moment(user.mdate).format("YYYY-MM-DD HH:mm:ss");

        }
        return res.render('pd/user/customer',{
            users : users,
            menu : [menu1,menu2,menu3]
        });
    });
});

router.get('/customer/detail',util.isLogIn,function(req,res){
    User.findOne({userid:req.query.userid,userclass:"normal"},(err,usr)=>{
        if(err){
            Log.create({document_name : "User",type:"error",contents:{error:err,content:"pd customer 상세 조회 DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/pop/close');
        }
        usr.wdateFormated = moment(usr.wdate).format("YYYY-MM-DD HH:mm:ss");
        usr.mdateFormated = moment(usr.mdate).format("YYYY-MM-DD HH:mm:ss");
        return res.render('pd/user/customerDetail',{
            userData : usr
        });
    });
});

router.get('/vender',util.isLogIn,function(req,res){
    var menu1= new util.menu("사용자 정보 조회/수정","/pd/user/customer","");
    var menu2= new util.menu("벤더 정보 조회/수정","","selected");
    var menu3= new util.menu("PD 정보 조회/수정","/pd/user/admin","");

    User.find({userclass:'vender'},(err,venders)=>{
        if(err){
            Log.create({document_name : "User",type:"error",contents:{error:err,content:"pd vender find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/pd');
        }
        for(var vender of venders){
            vender.wdateFormated = moment(vender.wdate).format("YYYY-MM-DD HH:mm:ss");
            vender.mdateFormated = moment(vender.mdate).format("YYYY-MM-DD HH:mm:ss");

        }
        return res.render('pd/user/vender',{
            venders : venders,
            menu : [menu1,menu2,menu3]
        });
    });
});

router.get('/vender/detail',util.isLogIn,function(req,res){
    User.findOne({userid:req.query.userid,userclass:"vender"},(err,vender)=>{
        if(err){
            Log.create({document_name : "User",type:"error",contents:{error:err,content:"pd vender 상세 조회 DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/pop/close');
        }
        vender.wdateFormated = moment(vender.wdate).format("YYYY-MM-DD HH:mm:ss");
        vender.mdateFormated = moment(vender.mdate).format("YYYY-MM-DD HH:mm:ss");
        return res.render('pd/user/venderDetail',{
            userData : vender
        });
    });
});

router.get('/admin',util.isLogIn,function(req,res){
    var menu1= new util.menu("사용자 정보 조회/수정","/pd/user/customer","");
    var menu2= new util.menu("벤더 정보 조회/수정","/pd/user/vender","");
    var menu3= new util.menu("PD 정보 조회/수정","","selected");

     return res.render('pd/user/admin',{
         menu : [menu1,menu2,menu3]
     });
});
module.exports = router;
