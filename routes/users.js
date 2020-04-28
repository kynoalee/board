var express = require('express');
var router = express.Router();
var User = require('../models/User');
var Log = require('../models/Log');
var passport = require('../config/passport');
var util = require('../util'); // 1
var moment = require('moment');

// New
router.get('/new', function(req, res){
  var user = req.flash('user')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('users/new', { user:user, errors:errors });
});

// create
router.post('/', function(req, res){
  User.create(req.body, function(err, user){
    if(err){
      req.flash('user', req.body);
      req.flash('errors', util.parseError(err)); // 1
      Log.create({document_name : "User",type:"error",contents:{error: err, user : req.body,content : "회원가입 시도 중 DB create 오류"},wdate:Date()});
      return res.redirect('/users/new');
    }
    Log.create({document_name : "User",type:"create",contents:{user : req.body,content : "회원가입 완료"},wdate:Date()});
    res.redirect('/');
  });
});

// show
router.get('/:userid', util.isLoggedin, checkPermission, function(req, res){
  User.findOne({userid:req.params.userid}, function(err, user){
    var wdateFormated = moment(user.wdate).format("YYYY-MM-DD");
    if(err) {
      Log.create({document_name : "User",type:"error",contents:{error : err,content:"회원정보 접근 중 DB findOne 오류"},wdate:Date()});
      return res.json(err);
    }
    Log.create({document_name : "User",type:"find",contents:{user : user,content:"회원정보 호출"},wdate:Date()});
    if(user.userclass == 'normal'){
      res.render('users/show', {user:user,wdateFormated:wdateFormated});
    } else if (user.userclass == 'vender'){
      // 벤더 마이 페이지
      res.render('users/show', {user:user,wdateFormated:wdateFormated});
    } else if (user.userclass == 'pd'){
      // pd my page
    } else{
      // 이외 클래스로 접근시 보낼 것
    }
  });
});

//relogin new 
router.get("/:userid/relogin",function(req,res){
  let userid = req.params.userid;
  let errors = req.flash('errors')[0] || {};

  res.render('users/relogin',{
    userid : userid,
    errors : errors
  });
});

//relogin try
router.post("/relogin",function(req, res, next) {
  passport.authenticate('relogin', function(err, user, info) {
    if (err) { 
      Log.create({document_name : "User",type:"error",contents:{error:err,content:"재로그인 에러"},wdate:Date()});
      return next(err); 
    }
    if (!user) { 
      Log.create({document_name : "User",type:"error",contents:{content:"권한 부족, 로그인 필요"},wdate:Date()});
      return res.redirect(req.body.userid+'/relogin'); 
    }
    req.logIn(user, function(err) {
      if (err) { 
        Log.create({document_name : "User",type:"error",contents:{user : user,error:err,content:"재로그인 시 로그인 에러"},wdate:Date()});
        return next(err); 
      }
      Log.create({document_name : "User",type:"login",contents:{user : user,content:"재로그인 완료"},wdate:Date()});
      return res.redirect(user.userid+'/edit');
    });
  })(req, res, next);
});

// edit
router.get("/:userid/edit", util.isLoggedin, checkPermission, function(req, res){
  var user = req.flash('user')[0];
  var errors = req.flash('errors')[0] || {};
  if(!user){
    User.findOne({userid:req.params.userid}, function(err, user){
      if(err) {
        Log.create({document_name : "User",type:"error",contents:{error : err,content:"회원정보수정 접근 중 DB에러"},wdate:Date()});
        return res.json(err);
      }
      Log.create({document_name : "User",type:"find",contents:{user : user,content:"회원정보수정 호출"},wdate:Date()});
      res.render('users/edit', { userid:req.params.userid, user:user, errors:errors });
    });
  }
  else {
    res.render('users/edit', { userid:req.params.userid, user:user, errors:errors });
  }
});

// update
router.put("/:userid", util.isLoggedin, checkPermission, function(req, res, next){ 
  User.findOne({userid:req.params.userid})
    .exec(function(err, user){
      if(err) {
        Log.create({document_name : "User",type:"error",contents:{error : err,content:"회원 정보 수정 중 DB 에러"},wdate:Date()});
        return res.json(err);
      }
      let changed = false;
      let mailChanged = false;
      // get param to post request
      req.body.userid = req.params.userid;

      // password current and new check
      if(req.body.password){
        user.password = req.body.password;
        user.passwordConfirmation = req.body.passwordConfirmation;
        changed = true;
        
      }      
      // name change check
      if(req.body.name && req.body.name != user.name){
        user.name = req.body.name;
        changed = true;
        
      }
      // company change check
      if(req.body.company && req.body.company != user.company){
        user.company = req.body.company;
        changed = true;
        
      }
      // country code change check
      if(req.body.countrycode && req.body.countrycode != user.countrycode){
        user.countrycode = req.body.countrycode;
        changed = true;
        
      }
      // contact number change check
      if(req.body.contactnumber && req.body.contactnumber != user.contactnumber){
        user.contactnumber = req.body.contactnumber;
        changed = true;
        
      }
      // email change check
      if(req.body.email && req.body.email != user.email){
        user.email = req.body.email;
        user.verified = false;
        changed = true;
        
        mailChanged = true;
      }
      // address1 change check
      if(req.body.address1 && req.body.address1 != user.address1){
        user.address1 = req.body.address1;
        changed = true;
        
      }
      // address2 change check
      if(req.body.address2 && req.body.address2 != user.address2){
        user.address2 = req.body.address2;
        changed = true;
        
      }
      // country change check
      if(req.body.country && req.body.country != user.country){
        user.country = req.body.country;
        changed = true;
        
      }
      // province change check
      if(req.body.province && req.body.province != user.province){
        user.province = req.body.province;
        changed = true;
        
      }
      // city change check
      if(req.body.city && req.body.city != user.city){
        user.city = req.body.city;
        changed = true;
        
      }
      // zipcode change check
      if(req.body.zipcode && req.body.zipcode != user.zipcode){
        user.zipcode = req.body.zipcode;
        changed = true;
        
      }
      if(changed){
        user.mdate = Date();
        user.msubject = req.user.userid;
        Log.create({document_name : "User",type:"update",contents:{before : user,after : req.body,content:"변경되는 정보"},wdate:Date()});
      }
      // save updated user
      user.save(function(err, user){
        if(err){
          req.flash('user', req.body);
          req.flash('errors', util.parseError(err));
          Log.create({document_name : "User",type:"error",contents:{user : req.body,error : err,content:"회원정보 수정 update DB 에러"},wdate:Date()});
          return res.redirect('/users/'+req.params.userid+'/edit'); // 1
        }
        if(mailChanged){
          req.logout();
          res.redirect('/login');
        }else{
          res.redirect('/users/'+user.userid);
        }
      });
  });
});

router.get('/management',util.isLoggedin,checkPermission,function(req,res){
  // pd 권한자 회원 관리
});

module.exports = router;

// private functions // 2
function checkPermission(req, res, next){
  User.findOne({userid:req.params.userid}, function(err, user){
   if(err) return res.json(err);
   if(user.id != req.user.id) return util.noPermission(req, res);
 
   next();
  });
 }