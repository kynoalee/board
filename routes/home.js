var express = require('express');
var router = express.Router();
var passport = require('../config/passport');
var authToken = require('../modules/auth');

// Home
router.get('/', function(req, res){
  var errors = req.flash('errors')[0] ||{};
  res.render('home/welcome',{
    errors : errors
  });
});
router.get('/about', function(req, res){
  res.render('home/about');
});

// Login
router.get('/login', function (req,res) {
  var userid = req.flash('userid')[0];
  var errors = req.flash('errors')[0] || {};
  res.render('home/login', {
    userid:userid,
    errors:errors
  });
});

// auth Token
router.get('/auth',function (req,res){
  let email = req.query.email;
  let token = req.query.token;
  html = {content1:'',content2:'',pageUrl:''};
  if(authToken.verifyToken(email,token)){
    // 성공
    html.content1 = '인증되었습니다. 재로그인해주세요.';
    html.pageUrl = '/login';
    html.content2 = '로그인하러가기';
  } else {
    // 실패
    html.content1 = '인증실패했습니다. 재시도하거나 문의해주세요.';
    html.pageUrl = '/';
    html.content2 = '홈으로가기';
  }
  res.render('home/confirm',{
    html : html
  });
});

// Post Login
router.post('/login',
  function(req,res,next){
    var errors = {};
    var isValid = true;

    if(!req.body.userid){
      isValid = false;
      errors.userid = 'Userid is required!';
    }
    if(!req.body.password){
      isValid = false;
      errors.password = 'Password is required!';
    }

    if(isValid){
      next();
    }
    else {
      req.flash('errors',errors);
      res.redirect('/login');
    }
  },
  passport.authenticate('local-login', {
    successRedirect : '/',
    failureRedirect : '/login'
  }
));

// Logout
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;