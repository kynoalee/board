var express = require('express');
var router = express.Router();
var User = require('../models/User');
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
      return res.redirect('/users/new');
    }
    res.redirect('/');
  });
});

// show
router.get('/:userid', util.isLoggedin, checkPermission, function(req, res){
  User.findOne({userid:req.params.userid}, function(err, user){
    var wdateFormated = moment(user.wdate).format("YYYY-MM-DD");
    if(err) return res.json(err);
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
    if (err) { return next(err); }
    if (!user) { return res.redirect(req.body.userid+'/relogin'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
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
      if(err) return res.json(err);
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
    .select('password')
    .exec(function(err, user){
      if(err) return res.json(err);

      // update user object
      user.originalPassword = user.password;
      user.password = req.body.newPassword? req.body.newPassword : user.password;
      for(var p in req.body){
        user[p] = req.body[p];
      }

      // save updated user
      user.save(function(err, user){
        if(err){
          req.flash('user', req.body);
          req.flash('errors', util.parseError(err));
          return res.redirect('/users/'+req.params.userid+'/edit'); // 1
        }
        res.redirect('/users/'+user.userid);
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