var moment = require('moment');
var express  = require('express');
var router = express.Router();
var util = require('./pdUtil');
var nameSetting = require('../../config/nameSetting');
var Order = require('../../models/Order');
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
    Order.Detail.find({order_detailnum : orderDetailNum},(err,detail)=>{
        if(err){
            Log.create({document_name : "Order",type:"error",contents:{error:err,content:"pd order detail find DB에러"},wdate:Date()});
            console.log(err);
            req.flash("errors",{message : "DB ERROR"});
            return res.redirect('/pd');
        }
        res.render('pd/order/orderDetail',{
            menu : [],
            detail : detail
        });
    });
    
});


module.exports = router;