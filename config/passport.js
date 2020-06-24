// config/passport.js

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy; // 1
var User = require('../models/User');
var nodeMailer = require('../modules/Mail');
var authToken = require('../modules/auth');
var config = require('./config');

// serialize & deserialize User // 2
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(id, done) {
  User.findOne({_id:id}, function(err, user) {
    done(err, user);
  });
});

// local strategy // 3
passport.use('local-login',
  new LocalStrategy({
      usernameField : 'userid', // 3-1
      passwordField : 'password', // 3-1
      passReqToCallback : true
    },
    function(req, userid, password, done) { // 3-2
      User.findOne({userid:userid})
        .select({password:1,email:1,verified:1})
        .exec(function(err, user) {
          if (err) return done(err);
          if (!user || !user.authenticate(password)){ // 3-3
            req.flash('userid', userid);
            req.flash('errors', {login:'The userid or password is incorrect.'});
            return done(null, false);
          }
          if (!user.verified) {
            // 토큰생성
            console.log("not verified. send email....");
            var keyForVerify=authToken.generateToken();
            authToken.updateToken(user.email,keyForVerify);
            var veriUrl = 'var url = "http://' + req.get('host')+'/?email'+'&token='+keyForVerify;
            nodeMailer.mailVerification('인증',user.email,'인증 메일입니다.', "<html><body><a href='"+config.serverUrl+"/auth?email="+ user.email +"&token="+keyForVerify+"'>인증하기</a></body></html>");
            req.flash('userid',userid);
            req.flash('errors',{login:'메일 인증해야합니다.메일을 확인해주세요. your mail address is '+user.email});
            return done(err);
          }
          return done(null, user);
        });
    }
  )
);

// relogin
passport.use('relogin',
    new LocalStrategy({
      usernameField : 'userid', // 3-1
      passwordField : 'password', // 3-1
      passReqToCallback : true
    },function(req,userid,password,done){
      User.findOne({userid:userid})
        .select({password:1,userid:1})
        .exec(function(err, user) {
          if (err) return done(err);
          if (!user || !user.authenticate(password)){ // 3-3
            req.flash('userid', userid);
            req.flash('errors', {login:'password is incorrect.'});
            return done(null, false);
          }
          return done(null,user);
        });
    })
);

// pd login
passport.use('pd-login',
  new LocalStrategy({
      usernameField : 'userid', // 3-1
      passwordField : 'password', // 3-1
      passReqToCallback : true
    },
    function(req, userid, password, done) { // 3-2
      User.findOne({userid:userid})
        .select({password:1,userclass:1})
        .exec(function(err, user) {
          if (err) return done(err);
          if (!user || !user.authenticate(password)){ // 3-3
            req.flash('userid', userid);
            req.flash('errors', {login:'The userid or password is incorrect.'});
            return done(null, false);
          }
          if (user.userclass != "pd") {
            req.flash('errors', {login:'Permission reject'});
            return done(null, false);
          }
          return done(null, user);
        });
    }
));

module.exports = passport;