var mongoose = require('mongoose');

// schema
var orderSummarySchema = mongoose.Schema({
  ordernum:{
    type:Number,
    unique:true
  },
  orderid:String,
  orderdate:Date,
  mdate:Date,
  vender:String,
  status:Number,
  customermemo:String,
  price:Number,
  deadline:String,
  prototype_bool:Boolean,
  manufacturingConfirm : Boolean
});

var orderDetailSchema = mongoose.Schema({
  order_detailnum:{
    type:Number,
    unique:true,
    required:[true],
    trim:true
  },
  orderlink:Number,
  filelink:Array,
  summary:{
    type:String,
    required:[true,'summary is required!']
  },
  description:{
    type:String,
    required:[true,'description is required']
  },
  wdate:{
    type:Date,
    default:Date()
  },
  userid : String,
  userclass : String,
  status : Number,
  
  // customer side
  size:String,
  color:String,
  material:String,
  quantity:String,
  deadline:String,

  // vender side
  invoice:String,
  destination:String,
  deliverycom:String,

  //pd side
  accepted : {
    type:Boolean,
    default : false
  },
  acceptid : String
});

// model & export
var Summary = mongoose.model('summary', orderSummarySchema);
var Detail = mongoose.model('detail', orderDetailSchema);

module.exports.Summary = Summary;
module.exports.Detail = Detail;

//