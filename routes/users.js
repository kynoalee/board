// routes/users.js

var express = require('express');
var router = express.Router();
var User = require('../models/User');

// Index // 1
router.get('/', function(req, res){
  User.find({})
    .sort({username:1})
    .exec(function(err, users){
      if(err) return res.json(err);
      res.render('users/index', {users:users});
    });
});

// New
router.get('/new', function(req, res){
  res.render('users/new');
});

// create
router.post('/', function(req, res){
  User.create(req.body, function(err, user){
    if(err) return res.json(err);
    res.redirect('/users');
  });
});

// show
router.get('/:username', function(req, res){
  User.findOne({username:req.params.username}, function(err, user){
    if(err) return res.json(err);
    res.render('users/show', {user:user});
  });
});

// edit
router.get('/:username/edit', function(req, res){
  User.findOne({username:req.params.username}, function(err, user){
    if(err) return res.json(err);
    res.render('users/edit', {user:user});
  });
});

// update // 2
router.put('/:username', function(req, res, next){
  User.findOne({username:req.params.username}) // 2-1
    .select('password') // 2-2
    .exec(function(err, user){
      if(err) return res.json(err);

      // update user object
      user.originalPassword = user.password;
      user.password = req.body.newPassword? req.body.newPassword : user.password; // 2-3
      for(var p in req.body){ // 2-4
        user[p] = req.body[p];
      }

      // save updated user
      user.save(function(err, user){
        if(err) return res.json(err);
        res.redirect('/users/'+user.username);
      });
  });
});

// destroy
router.delete('/:username', function(req, res){
  User.deleteOne({username:req.params.username}, function(err){
    if(err) return res.json(err);
    res.redirect('/users');
  });
});

module.exports = router;
