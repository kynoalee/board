var express  = require('express');
var router = express.Router();
var util = require('./pdUtil');

var menu = function(name,href,selected){
    this.name = name;
    this.href = href;
    this.selected = selected;
    
}
//
router.get('/',util.isLogIn,function(req,res){
    var menu1= new menu("사용자 정보 조회/수정","","selected");
    var menu2= new menu("벤더 정보 조회/수정","/pd/user/vender","");
    var menu3= new menu("PD 정보 조회/수정","/pd/user/admin","");

     return res.render('pd/user/customer',{
         menu : [menu1,menu2,menu3]
     });
 });

router.get('/customer',util.isLogIn,function(req,res){
    var menu1= new menu("사용자 정보 조회/수정","","selected");
    var menu2= new menu("벤더 정보 조회/수정","/pd/user/vender","");
    var menu3= new menu("PD 정보 조회/수정","/pd/user/admin","");

     return res.render('pd/user/customer',{
         menu : [menu1,menu2,menu3]
     });
});

router.get('/vender',util.isLogIn,function(req,res){
    var menu1= new menu("사용자 정보 조회/수정","/pd/user/customer","");
    var menu2= new menu("벤더 정보 조회/수정","","selected");
    var menu3= new menu("PD 정보 조회/수정","/pd/user/admin","");

     return res.render('pd/user/vender',{
         menu : [menu1,menu2,menu3]
     });
});

router.get('/admin',util.isLogIn,function(req,res){
    var menu1= new menu("사용자 정보 조회/수정","/pd/user/customer","");
    var menu2= new menu("벤더 정보 조회/수정","/pd/user/vender","");
    var menu3= new menu("PD 정보 조회/수정","","selected");

     return res.render('pd/user/admin',{
         menu : [menu1,menu2,menu3]
     });
});
module.exports = router;
