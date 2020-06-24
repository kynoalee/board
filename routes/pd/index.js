var express  = require('express');
var router = express.Router();
var passport = require('../../config/passport');

//
router.get('/',isLogIn,function(req,res){
    return res.render('pd/home/home');
});

router.get('/login',function(req,res){
    var errors = req.flash('errors')[0] || {};
    return res.render('pd/home/login',{
        errors : errors
    });
});

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
  passport.authenticate('pd-login', {
    successRedirect : '/pd',
    failureRedirect : '/pd/login'
  }
));

router.get('/logout',function(req,res){
    req.logout();
    res.redirect('/pd/login');
});

module.exports = router;

function isLogIn(req, res, next){
    if(req.isAuthenticated()){
        if(req.user.userclass=="pd"){
            next();
        } else {
            req.flash('errors', {login:'Permission reject'});
            res.redirect('/pd/login');
        }
    } 
    else {
      req.flash('errors', {login:'Please login first'});
      res.redirect('/pd/login');
    }
}