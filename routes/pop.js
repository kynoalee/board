var express  = require('express');
var router = express.Router();
var fs = require('fs');
var nameSetting = require('../config/nameSetting');
var File = require('../models/File');
var Order = require('../models/Order');
var Board = require('../models/Board');
var util = require('../util'); // 1

router.get('/detail',function(req, res){
    // test dragon
    var userclass = 'normal';
    var userid = 'imgcom';
    var request = req.query;
    var filesInfo = [];

    Order.Detail.find({orderlink:request.ordernum,status:request.status},function(err,detail){
        // 관련 업로드된 파일정보 모두 가져오기
        let files = [];
        for(let details of detail){
            for(let val of details.filelink){
                files[files.length] = {servername : val};
            }
        }

        File.find({$or:files},function(err,file){
            if(err) console.log(err);
            filesInfo[filesInfo.length] = file;

            // 시각화 파일 정리
            var visualFiles  = {
                images : [],
                videos : [],
                gifs :[]
            };

            for(let fileInfo of file){ 
                let filetype = fileInfo.filetype.split('/');
                if(filetype[0] == 'image' && filetype[1] != 'gif'){
                    visualfileInfo.images.push(fileInfo);
                } else if(filetype[0] == 'image' && filetype[1] == 'gif'){
                    visualfileInfo.gifs.push(fileInfo);
                }
                 else if(filetype[0] == 'video'){
                    visualfileInfo.videos.push(fileInfo);
                }
                
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

module.exports = router;
