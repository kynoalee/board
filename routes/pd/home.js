var express  = require('express');
var router = express.Router();

//
router.get('/',function(req,res){
    return res.render('pop/close');
});

module.exports = router;
