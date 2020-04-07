// models/User.js
var fs = require("fs");
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs'); // 1
var validationJSON = fs.readFileSync("../config/validation.json");
var validation = JSON.parse(validationJSON);


// schema //1
var userSchema = mongoose.Schema({
  userclass:{
    type:String,
    required:[true,'User classification is required'],
    match:[RegExp(validation.userclass),'Invalid value detected. Please resubmit'],
    trim:true
  },
  userid:{
    type:String,
    required:[true,'Should be 4-12 English letters or numbers'],
    match:[RegExp(validation.userid),'Should be 4-12 English letters or numbers'],
    trim:true,
    unique:true
  },
  password:{
    type:String,
    required:[true,'Should be minimum 8 characters of alphabet and number combination'],
    match:[RegExp(validation.password),'Should be minimum 8 characters of alphabet and number combination'],
    select:false
  },
  name:{
    type:String,
    required:[true,'Nickname is required'],
    match:[RegExp(validation.name),'Should be maximum 12 characters!'],
    trim:true
  },
  company:{
    type:String,
    required:[true,'Company is required'],
    trim:true
  },
  countrycode:{
    type:Number,
    required:[true,'Country code is required'],
    trim:true
  },
  contactnumber:{
    type:String,
    required:[true,'Contact number is required'],
    match:[RegExp(validation.contactnumber),'Should be a valid number'],
    trim:true
  },
  email:{
    type:String,
    required:[true,"Email is required"],
    match:[RegExp(validation.email),'Should be a vaild email address'],
    trim:true,
    unique:true
  },
  verified:{
    type:Boolean,
    default:false
  },
  verifytoken:{
    type:String
  },
  wdate:{
    type:Date,
    default:Date()
  },
  mdate:{
    type:Date,
    default:Date()
  },
  msubject:{
    type:String,
    trim:true
  },
  edate:{
    type:Date
  },
  disabled:{
    type:Boolean
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
var passwordRegex = RegExp(validation.password);
var passwordRegexErrorMessage = 'Should be minimum 8 characters of alphabet and number combination';
userSchema.path('password').validate(function(v) {
  var user = this;

  if(!user.passwordConfirmation){
    user.invalidate('passwordConfirmation', 'Password Confirmation is required.');
  }

  if(!passwordRegex.test(user.password)){
    user.invalidate('password', passwordRegexErrorMessage);
  }
  else if(user.password !== user.passwordConfirmation) {
    console.log('take this');
    user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
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
