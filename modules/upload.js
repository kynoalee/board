var moment = require('moment');
var File = require('../models/File');


var Upload = {
    delayFileCreate : (createObj) =>{
        return new Promise((resolve) => 
            { 
               File.create(createObj,function(err,file){
                   if(err){
                       Log.create({document_name : "File",type:"error",contents:{error:err,content:"파일정보 find DB에러"},wdate:Date()});
                       console.log(err);
                   }
                   console.log("done");
               });                    
               resolve(); 
            });
    },

    createFiles : async(array,req,next)=>{
        var fileLink =[];
        for(let fileInfo of array){
            let creatObj ={
                originname:fileInfo.originalname,
                servername:fileInfo.filename,
                filepath:fileInfo.path.replace("../",""),
                uploadid:req.user.userid,
                filetype:fileInfo.mimetype,
                size:fileInfo.size,
                udate:Date()
            };
            console.log('filename '+fileInfo.filename + " DB upload...")
            await Upload.delayFileCreate(creatObj);
            fileLink[fileLink.length] = fileInfo.filename;
        }
        req.body.filelink = fileLink;
        next();
    },

    createServerName : function(origin){
        let originSplitName = origin.split('.');
        let extension = originSplitName.pop();
        let serverName = "file";
        let newServerName =moment().format('YYMMDDHHmmssSSS_')+serverName+'.'+extension;
        let addPath = 'etc/';
        if(/(txt|text)/.test(extension)) {
            addPath = 'texts/';
        }
        else if(/(jpeg|jpg|png)/.test(extension)) {
            addPath = 'images/';
        }
        else if(/(mp4|avi|mkv)/.test(extension)) {
            addPath = 'videos/';
        }
        else if(/(gif)/.test(extension)) {
            addPath = 'gifs/';
        }
        else if(/(pdf)/.test(extension)) {
            addPath = 'pdf/';
        }
        return {serverName : newServerName, extension : extension,addPath : addPath};
    }
}

module.exports = Upload;