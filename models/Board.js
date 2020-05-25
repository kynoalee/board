// models/board.js

var mongoose = require('mongoose');

// schema
var boardSchema = mongoose.Schema({
  qnanum:{
    type: Number,
    unique: true
  }, 
  where:String, // 어디서 문의한건지
  linknum:Number, // 연결 주문,입찰 등 번호
  userid:String, 
  userclass:String,
  customer:String,
  vender:String,
  status : String, 
  // question,answer,negoQ,negoA,nego,reNego,reject,accept
  nego:Boolean, // 네고관련 문의인지 
  
  // 문의 내용
  summary:String,
  contents:String,
  filelinks:Array,
  price:Number,
  deadline:String,

  // 연결 문의 포인터
  parents:Number,
  children:Number,

  wdate:Date,
  mdate:Date
});

// model & export
var Board = mongoose.model('board', boardSchema);
module.exports = Board;
