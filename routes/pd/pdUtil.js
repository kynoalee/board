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

// side menu
util.menu = function(name,href,selected){
    this.name = name;
    this.href = href;
    this.selected = selected;   
};

module.exports = util;