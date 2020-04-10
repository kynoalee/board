var express  = require('express');
var router = express.Router();
var multer = require('multer');
var moment = require('moment');
var config = require('../config/config')
var util = require('../util'); // 1
var File = require('../models/File');
var Order = require('../models/Order');
var auth = require('../modules/auth');

// Index   
router.get('/',util.isLoggedin,function(req, res){
    res.render('upload/new',{
        errors:'',
        order:''
    });    
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let newName = createServerName(file.originalname);
        cb(null, config.fileUrl+newName.addPath)
    },
    filename: function (req, file, cb) {
        let newName = createServerName(file.originalname);
        cb(null, newName.serverName)
    }
})
var upload = multer({ storage: storage })

// create
router.post('/',upload.array('file'),util.isLoggedin, function(req,res){
    req.body.filelink = new Array();
    let num = 0;
    // File create
    (async()=>{

    req.files.forEach(function(fileInfo,index){

            let createObj = {originname : fileInfo.originalname,filepath:fileInfo.path.replace('../',''),uploadid:req.user.userid,filetype:fileInfo.mimetype};
            
            // file unique key
            console.log('generate unique file key....')
            auth.generateFileKey().then(filKey =>{
                req.body.filelink[num] = createObj.filekey;
                num+=1;
    
                File.create(createObj, function(err, file){
                    console.log('create File Document...')
                    if(err){
                        console.log('create file Document error!')
                        req.flash('errors', util.parseError(err)); // 1
                        return res.redirect('/upload');
                    }
                    console.log('create file Document done!')
                })
            });
           
            
        })
    })().then(v=>{
        // order_detail create
        Order.Detail.create(req.body, function(err, file){
            console.log('create Order Detail Document...')
            if(err){
                console.log('create order document error')
                req.flash('order', req.body);
                req.flash('errors', util.parseError(err)); // 1
                return res.redirect('/upload');
            }
            console.log('create order document done!')
        res.redirect('/upload');
        });    
    })
});

function createServerName(origin){
    let originSplitName = origin.split('.');
    let extension = originSplitName.pop();
    let serverName = originSplitName.join('.');
    let newServerName =moment().format('YYMMDDHHmmss_')+serverName+'.'+extension;
    let addPath = 'etc/';
    if(/(txt|text)/.test(extension)) {
        addPath = 'texts/';
    }
    else if(/(jpeg|jpg|png)/.test(extension)) {
        addPath = 'images/';
    }
    else if(/(mp4|avi|mkv)/.test(extension)) {
        addPaht = 'videos/';
    }
    else if(/(gif)/.test(extension)) {
        addPath = 'gif/';
    }
    return {serverName : newServerName, extension : extension,addPath : addPath};
}

module.exports = router;
