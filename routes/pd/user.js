var moment = require('moment');
var express  = require('express');
var router = express.Router();
var util = require('./pdUtil');
var User = require('../../models/User');

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

router.get('/customer/detail',function(req,res){
    return res.render('pd/user/customerDetail');
});

router.get('/vender',util.isLogIn,function(req,res){
    var menu1= new util.menu("사용자 정보 조회/수정","/pd/user/customer","");
    var menu2= new util.menu("벤더 정보 조회/수정","","selected");
    var menu3= new util.menu("PD 정보 조회/수정","/pd/user/admin","");

     return res.render('pd/user/vender',{
         menu : [menu1,menu2,menu3]
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
