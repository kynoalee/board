var fs = require('fs');
var Log = require("../models/Log");

var fileDownload = function(DB,fileName,res){
    DB.find({servername:fileName},function(err,file){
        if(err){
            Log.create({document_name : "File",type:"error",contents:{error:err,content:"파일업로드를 위한 파일 데이터 불러오는중 DB 에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        console.log(file[0]);
        res.setHeader('Content-disposition','attachment;filename='+file[0].originname);
        res.setHeader('Content-type',file[0].filetype);
        var filestream = fs.createReadStream(__dirname+"/../../"+file[0].filepath);
        filestream.pipe(res);
        Log.create({document_name : "File",type:"upload",contents:{file:file,content:"파일업로드"},wdate:Date()});
    });
}
module.exports.fileDownload = fileDownload;