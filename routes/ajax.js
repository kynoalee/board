var express  = require('express');
var router = express.Router();
var File = require("../models/File");

router.post('/getFiles',function(req,res){
    if(req.body.fileLinks){
        var filelink = req.body.fileLinks.split(',');
        var files = [];
        for(let val of filelink){
            files[files.length] = {servername : val};
        }
        File.find({$or:files},function(err,file){
            if(err){
                console.log(err);
                return res.send({result:"mongo error"});
            }
            var filesInfo = [];
            for(let fileInfo of file){ 
                filesInfo[filesInfo.length] = {
                    'origin' : fileInfo.originname,
                    'server' : fileInfo.servername,
                    'byte' : calculateByte(fileInfo.size)
                };
            }
            return res.send({result:"success",data:filesInfo});
        });
    }else{
        return res.send({result:"noFiles"});
    }
});
function calculateByte(byte){
    let calByte = 0;
    let stringByte = 'Byte';
    if(byte>=1000 && byte < 1000000){
        calByte = (byte / 1000).toFixed(2);
        stringByte = "KB";
    } else if(byte >1000000){
        calByte = (byte / 1000000).toFixed(2);
        stringByte = "MB";
    } else {
        calByte = byte;
    }
    return calByte+stringByte;
}
module.exports = router;
