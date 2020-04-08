var express  = require('express');
var router = express.Router();
var File = require('../models/File');

// Index 
router.get('/', function(req, res){
    res.render('upload/new',{
        errors:'',
        order:''
    });    
});

module.exports = router;
