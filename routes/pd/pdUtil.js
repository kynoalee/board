var util = {};

util.isLogIn = function(req, res, next){
    if(req.isAuthenticated()){
        if(req.user.userclass=="pd"){
            next();
        } else {
            req.flash('errors', {login:'Permission reject'});
            res.redirect('/pd/login');
        }
    } 
    else {
      req.flash('errors', {login:'Please login first'});
      res.redirect('/pd/login');
    }
};


module.exports = util;