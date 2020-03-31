// models/User.js

var mongoose = require('mongoose');
var bcrypt = require('bcryptjs'); // 1

// schema //1
var userSchema = mongoose.Schema({
  username:{
    type:String,
    required:[true,'Should be 4-12 English letters or numbers'],
    match:[/^[A-Za-z0-9+]{4,12}$/,'Should be 4-12 English letters or numbers'],
    trim:true,
    unique:true
  },
  password:{
    type:String,
    required:[true,'Should be minimum 8 characters of alphabet and number combination'],
    match:[/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,'Should be minimum 8 characters of alphabet and number combination'],
    select:false
  },
  name:{
    type:String,
    required:[true,'Nickname is required'],
    match:[/^.{1,12}$/,'Should be maximum 12 characters!'],
    trim:true
  },
  company:{
    type:String,
    required:[true,'Company is required'],
    trim:true
  },
  contactnumber:{
    type:String,
    required:[true,'Contact number is required'],
    match:[/^([0-9]{2,4}-[0-9]{3,4}-[0-9]{4})$|^([0-9]{11})$/,'Should be a valid number'],
    trim:true
  },
  email:{
    type:String,
    required:[],
    match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,'Should be a vaild email address'],
    trim:true
  }
},{
  toObject:{virtuals:true}
});

// virtuals // 2
userSchema.virtual('passwordConfirmation')
  .get(function(){ return this._passwordConfirmation; })
  .set(function(value){ this._passwordConfirmation=value; });

userSchema.virtual('originalPassword')
  .get(function(){ return this._originalPassword; })
  .set(function(value){ this._originalPassword=value; });

userSchema.virtual('currentPassword')
  .get(function(){ return this._currentPassword; })
  .set(function(value){ this._currentPassword=value; });

userSchema.virtual('newPassword')
  .get(function(){ return this._newPassword; })
  .set(function(value){ this._newPassword=value; });

// password validation // 2
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
var passwordRegexErrorMessage = 'Should be minimum 8 characters of alphabet and number combination';
userSchema.path('password').validate(function(v) {
  var user = this;

  // create user
  if(user.isNew){
    if(!user.passwordConfirmation){
      user.invalidate('passwordConfirmation', 'Password Confirmation is required.');
    }

    if(!passwordRegex.test(user.password)){
      user.invalidate('password', passwordRegexErrorMessage);
    }
    else if(user.password !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }

  // update user
  if(!user.isNew){
    if(!user.currentPassword){
      user.invalidate('currentPassword', 'Current Password is required!');
    }
    else if(!bcrypt.compareSync(user.currentPassword, user.originalPassword)){
      user.invalidate('currentPassword', 'Current Password is invalid!');
    }

    if(user.newPassword && !passwordRegex.test(user.newPassword)){
      user.invalidate("newPassword", passwordRegexErrorMessage);
    }
    else if(user.newPassword !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }
});

// hash password // 3
userSchema.pre('save', function (next){
  var user = this;
  if(!user.isModified('password')){ // 3-1
    return next();
  }
  else {
    user.password = bcrypt.hashSync(user.password); //3-2
    return next();
  }
});

// model methods // 4
userSchema.methods.authenticate = function (password) {
  var user = this;
  return bcrypt.compareSync(password,user.password);
};

// model & export
var User = mongoose.model('user',userSchema);
module.exports = User;
