var express  = require('express');
var router = express.Router();
var multer = require('multer');
var moment = require('moment');
var config = require('../config/config')
var File = require('../models/File');

// Index 
router.get('/', function(req, res){
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

router.post('/',upload.array('file'),function(req,res){
    console.log(req.files); 
    res.redirect('/upload');
});

function createServerName(origin){
    let originSplitName = origin.split('.');
    let extension = originSplitName.pop();
    let serverName = originSplitName.join('.');
    let newServerName =moment().format('YYMMDDHHmmssS_')+serverName+'.'+extension;
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
