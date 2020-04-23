var express  = require('express');
var router = express.Router();
var nameSetting = require('../config/nameSetting');
var File = require('../models/File');
var Order = require('../models/Order');
var Board = require('../models/Board');
var util = require('../util'); // 1
var download = require('../modules/download');

router.get('/detail',function(req, res){
    var userid = 'imgcom';
    var venderid = 'imgcam';
    var request = req.query;
    var filesInfo = [];
    console.log(req.user);
    Order.Summary.find({ordernum:request.ordernum,$or:[{userid:userid},{vender:venderid}]},function(err,summary){
        Order.Detail.find({status:request.status,orderlink:request.ordernum},function(err,detail){
            // 관련 업로드된 파일정보 모두 가져오기
            let files = [];
            for(let details of detail){
                for(let val of details.filelink){
                    files[files.length] = {servername : val};
                }
            }
    
            File.find({$or:files},function(err,file){
                if(err) console.log(err);
                // 시각화 파일 정리
                var visualFiles  = {
                    images : [],
                    videos : [],
                    gifs :[]
                };
    
                for(let fileInfo of file){ 
                    let filetype = fileInfo.filetype.split('/');
                    if(filetype[0] == 'image' && filetype[1] != 'gif'){
                        visualFiles.images.push(fileInfo);
                    } else if(filetype[0] == 'image' && filetype[1] == 'gif'){
                        visualFiles.gifs.push(fileInfo);
                    }
                     else if(filetype[0] == 'video'){
                        visualFiles.videos.push(fileInfo);
                    }
                    filesInfo[filesInfo.length] = {
                        'origin' : fileInfo.originname,
                        'server' : fileInfo.servername,
                        'byte' : calculateByte(fileInfo.size)
                    };
                }
    
                // 해당 상태값 입력한 정보 최신화
                detail.sort(function(a,b){
                    return a.order_detailnum < b.order_detailnum ? -1 : a.order_detailnum > b. order_detailnum ? 1 : 0;
                });
    
                // 상태 값 시각화
                var statusName;
                switch(request.status){
                    case '1' : statusName = nameSetting.statusName.status1; 
                        break;
                    case '2' : statusName = nameSetting.statusName.status2; 
                        break;
                    case '3' : statusName = nameSetting.statusName.status3; 
                        break;
                    case '4' : statusName = nameSetting.statusName.status4; 
                        break;
                    case '5' : statusName = nameSetting.statusName.status5; 
                        break;
                    case '6' : statusName = nameSetting.statusName.status6; 
                        break;
                    default : break;
                }
    
                // qna 설정
    
                res.render('pop/detail',{
                    filesInfo:filesInfo,
                    details:detail[0],
                    visualFiles : visualFiles,
                    statusName : statusName
                }); 
            });
        });  
    });
    
});

router.get("/detail/:servername",function(req,res){
    let fileName = req.params.servername;
    download.fileDownload(File,fileName,res);
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
