var mongoose = require('mongoose');

// schema
var orderSummarySchema = mongoose.Schema({
    ordernum:{
      type:Number,
      unique:true
    },
    orderdate:Date,
    mdate:Date,
    status:Number,
    customermemo:String
  });

var orderDetailSchema = mongoose.Schema({
    order_detailnum:{
      type:Number,
      unique:true,
      required:[true],
      trim:true
    },
    orderid:String,
    orderlink:String,
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
    
    // customer side
    size:String,
    color:String,
    material:String,
    prototypeB:Boolean,
    proto_quantity:String,
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

var orderLastSchema = mongoose.Schema({
    
  });

// model & export
var Summary = mongoose.model('summary', orderSummarySchema);
var Detail = mongoose.model('detail', orderDetailSchema);
var Last = mongoose.model('last', orderLastSchema);

module.exports.Summary = Summary;
module.exports.Detail = Detail;
module.exports.Last = Last;

//