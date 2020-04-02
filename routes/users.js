var express = require('express');
var router = express.Router();
var User = require('../models/User');
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
    res.render('users/show', {user:user,wdateFormated:wdateFormated});
  });
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


module.exports = router;

// private functions // 2
function checkPermission(req, res, next){
  User.findOne({userid:req.params.userid}, function(err, user){
   if(err) return res.json(err);
   if(user.id != req.user.id) return util.noPermission(req, res);
 
   next();
  });
 }