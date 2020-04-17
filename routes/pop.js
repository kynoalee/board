var express  = require('express');
var router = express.Router();
var File = require('../models/File');
var Order = require('../models/Order');
var util = require('../util'); // 1

router.get('/detail',function(req, res){
    // test dragon
    var userclass = 'normal';
    var userid = 'imgcom';
    var request = req.query;

    Order.Detail.find({orderlink:request.ordernum,status:request.status},function(err,detail){
        let test = [];
        for(let val of detail[0].filelink){
            test[test.length] = {servername : val};
        }
        console.log(test);
        File.find({$or:test},function(err,file){
            console.log(file);
        });
    });

    res.render('pop/detail',{
        request:request
    }); 
});

module.exports = router;
