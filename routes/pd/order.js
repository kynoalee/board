var moment = require('moment');
var express  = require('express');
var router = express.Router();
var util = require('./pdUtil');
var common = require('../../modules/common');
var Download = require('../../modules/download');
var nameSetting = require('../../config/nameSetting');
var Order = require('../../models/Order');
var File = require('../../models/File');
var Log = require('../../models/Log');

router.get('/',util.isLogIn,function(req,res){
    return res.redirect('/pd/order/orderList');
});

router.get('/orderList',util.isLogIn,function(req,res){

    Order.Summary.find({ordernum : {$gt : 0}},(err,orders)=>{
        if(err){
            Log.create({document_name : "Order",type:"error",contents:{error:err,content:"pd order find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/pd');
        }
        for(var order of orders){
            order.wdateFormated = moment(order.wdate).format("YYYY-MM-DD HH:mm:ss");
            order.mdateFormated = moment(order.mdate).format("YYYY-MM-DD HH:mm:ss");
            // 상태값 프론트에 보낼 거 정제
            
            switch(order.status){
                case 1 : order.statusN = nameSetting.statusName['order'].value; 
                    break;
                case 2 : order.statusN = nameSetting.statusName['bidding'].value; 
                    break;
                case 3 : order.statusN = nameSetting.statusName['work'].value; 
                    break;
                case 4 : order.statusN = nameSetting.statusName['deli'].value; 
                    break;
                case 5 : order.statusN = nameSetting.statusName['done'].value; 
                    break;
                default : break;
            }
        }

        var menu1= new util.menu("주문 전체 조회","","selected");
        var menu2= new util.menu("주문 상세 전체 정보 조회","/pd/order/orderDetailList","");
    
        return res.render('pd/order/orderList',{
            menu : [menu1,menu2],
            orders : orders
        });
    });
});

router.get('/orderDetailList',util.isLogIn,function(req,res){

    Order.Detail.find({order_detailnum : {$gt : 0}},(err,orders)=>{
        if(err){
            Log.create({document_name : "Order",type:"error",contents:{error:err,content:"pd order find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/pd');
        }
        for(var order of orders){
            order.wdateFormated = moment(order.wdate).format("YYYY-MM-DD HH:mm:ss");
            // 상태값 프론트에 보낼 거 정제
            
            switch(order.status){
                case 1 : order.statusN = nameSetting.statusName['order'].value; 
                    break;
                case 2 : order.statusN = nameSetting.statusName['bidding'].value; 
                    break;
                case 3 : order.statusN = nameSetting.statusName['work'].value; 
                    break;
                case 4 : order.statusN = nameSetting.statusName['deli'].value; 
                    break;
                case 5 : order.statusN = nameSetting.statusName['done'].value; 
                    break;
                default : break;
            }

            switch(order.userclass){
                case 'normal' : order.userclassN = "주문자";
                    break;
                case 'vender' : order.userclassN = "제작자";
                    break;
                default : break;
            }
        }

        var menu1= new util.menu("주문 전체 조회","/pd/order/orderList","");
        var menu2= new util.menu("주문 상세 전체 정보 조회","","selected");
    
        return res.render('pd/order/orderDetailList',{
            menu : [menu1,menu2],
            orders : orders
        });
    });
});

router.get('/detail',util.isLogIn,(req,res)=>{
    var orderDetailNum = req.query.detailnum;
    Order.Detail.findOne({order_detailnum : orderDetailNum},(err,detail)=>{
        if(err){
            Log.create({document_name : "Order",type:"error",contents:{error:err,content:"pd order detail find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/pd');
        }
        detail.wdateFormated = moment(detail.wdate).format("YYYY-MM-DD HH:mm:ss");
        detail.mdateFormated = moment(detail.mdate).format("YYYY-MM-DD HH:mm:ss");

        switch(detail.userclass){
            case 'normal' : detail.userclassN = "주문자";
                break;
            case 'vender' : detail.userclassN = "제작자";
                break;
            default : break;
        }

        // 각 디테일 파일 정보 가져오기

        File.find({servername : {$in :detail.filelink}},(e,files)=>{ 
            if(e){
                Log.create({document_name : "File",type:"error",contents:{error:e,content:"주문상세 페이지 file find DB에러"},wdate:Date()});
                console.log(e);
            }
            var filesInfo = [];
            var visualFiles = {
                images:[],
                gifs:[],
                videos:[]
            }
            // 각 디테일에 걸려있는 파일 정보를 정제
            for(fileInfo of files){

                // 보여줄 수 있는 파일 정보
                let filetype = fileInfo.filetype.split('/');
                if(filetype[0] == 'image' && filetype[1] != 'gif'){
                    visualFiles.images.push(fileInfo);
                } else if(filetype[0] == 'image' && filetype[1] == 'gif'){
                    visualFiles.gifs.push(fileInfo);
                }
                else if(filetype[0] == 'video'){
                    visualFiles.videos.push(fileInfo);
                }

                // 다운로드 파일 정보.
                filesInfo[filesInfo.length] = {
                    'origin' : fileInfo.originname,
                    'server' : fileInfo.servername,
                    'byte' : common.calculateByte(fileInfo.size)
                };
            }
            detail.filesInfo = filesInfo;
            detail.visualFiles = visualFiles;

            res.render('pd/order/orderDetail',{
                menu : [],
                detail : detail
            });
        });  
    });
});

// 다운로드 라우터
router.get("/detail/:servername",util.isLogIn,function(req,res){
    let fileName = req.params.servername;
    Download.fileDownload(File,fileName,res);
});

module.exports = router;