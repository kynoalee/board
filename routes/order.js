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
    res.render('order/new',{
        errors:'',
        order:''
    });    
});

// list get
router.get('/list',function(req,res){
    // Order.Summary.create({
    //     ordernum:5,
    //     orderdate:Date(),
    //     mdate:Date(),
    //     status:3,
    //     customermemo:""
    // }, function(err, user){
    //     if(err){
    //       return res.redirect('/');
    //     }
    //     res.redirect('/');
    //   });
    Order.Summary.find({},function(err,arr){
        var summary = [];
        var summaryNum = {
            order : 0,
            ptWork : 0,
            ptDeli : 0,
            work : 0,
            deli : 0,
            done : 0,
            all : 0
        };
        for(var ob of arr){      
            let dateOb ={
                orderD : moment(ob.orderdate).format("YYYY-MM-DD"),
                orderH : moment(ob.orderdate).format("HH:mm:ss"),
                modiD : moment(ob.mdate).format("YYYY-MM-DD"),
                modiH : moment(ob.mdate).format("HH:mm:ss")
            }

            let stat = '';
            switch(ob.status){
                case 1 : stat = "주문";
                    summaryNum.order += 1;
                    summaryNum.all +=1;
                    break;
                case 2 : stat = "PT 제작";
                    summaryNum.ptWork += 1;      
                    summaryNum.all +=1;
                    break;
                case 3 : stat = "PT 배송";
                    summaryNum.ptDeli += 1;
                    summaryNum.all +=1;
                    break;
                case 4 : stat = "제작";
                    summaryNum.work += 1;
                    summaryNum.all +=1;
                    break;
                case 5 : stat = "배송";
                    summaryNum.deli += 1;
                    summaryNum.all +=1;
                    break;
                case 6 : stat = "확정";
                    summaryNum.done += 1;
                    summaryNum.all +=1;
                    break;
                    default:break;
            }

            let contents = {
                ordernum : ob.ordernum,
                orderdateD : dateOb.orderD,
                orderdateH : dateOb.orderH,
                modidateD : dateOb.modiD,
                modidateH : dateOb.modiH,
                status : stat,
                memo : ob.customermemo
            }
            summary.push(contents);
        }

        res.render('order/list',{
            summary : summary,
            summaryNum : summaryNum
        });
    })
   
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
var order = multer({ storage: storage })

// create
router.post('/',order.array('file'),util.isLoggedin, function(req,res){
    req.body.filelink = new Array();
    let num = 0;
    // File create

    // req.files.forEach(function(fileInfo,index){

    //         let createObj = {originname : fileInfo.originalname,filepath:fileInfo.path.replace('../',''),orderid:req.user.userid,filetype:fileInfo.mimetype};
            
    //         // file unique key
    //         console.log('generate unique file key....')
    //         auth.generateFileKey().then(filKey =>{
    //             req.body.filelink[num] = createObj.filekey;
    //             num+=1;
    
    //             File.create(createObj, function(err, file){
    //                 console.log('create File Document...')
    //                 if(err){
    //                     console.log('create file Document error!')
    //                     req.flash('errors', util.parseError(err)); // 1
    //                     return res.redirect('/order');
    //                 }
    //                 console.log('create file Document done!')
    //             })
    //         });
           
            
    //     })
    //     // order_detail create
    //     Order.Detail.create(req.body, function(err, file){
    //         console.log('create Order Detail Document...')
    //         if(err){
    //             console.log('create order document error')
    //             req.flash('order', req.body);
    //             req.flash('errors', util.parseError(err)); // 1
    //             return res.redirect('/order');
    //         }
    //         console.log('create order document done!')
    //     res.redirect('/order');
    //     });    
    
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
