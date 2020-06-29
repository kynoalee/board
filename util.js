var util = {};

util.parseError = function(errors){
  var parsed = {};
  if(errors.name == 'ValidationError'){
    for(var name in errors.errors){
      var validationError = errors.errors[name];
      parsed[name] = { message:validationError.message };
    }
  } 
  else if(errors.code == '11000' && errors.errmsg.indexOf('userid') > 0) {
    parsed.userid = { message:'This userid already exists!' };
  } 
  else {
    parsed.unhandled = JSON.stringify(errors);
  }
  return parsed;
}

util.isLoggedin = function(req, res, next){
    if(req.isAuthenticated()){
      if(req.user.userclass!="pd"){
        next();
      } else {
        req.flash('errors', {login:'Permission reject'});
            res.redirect('/login');
      }
    } 
    else {
      req.flash('errors', {login:'Please login first'});
      res.redirect('/login');
    }
  }
  
  util.noPermission = function(req, res){
    req.flash('errors', {login:"You don't have permission"});
    req.logout();
    res.redirect('/login');
  }
  
module.exports = util;