var fs = require('fs');

var fileDownload = function(DB,fileName,res){
    DB.find({servername:fileName},function(err,file){
        if(err){
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/');
        }
        console.log(file[0]);
        res.setHeader('Content-disposition','attachment;filename='+file[0].originname);
        res.setHeader('Content-type',file[0].filetype);
        var filestream = fs.createReadStream(__dirname+"/../../"+file[0].filepath);
        filestream.pipe(res);
    });
}
module.exports.fileDownload = fileDownload;