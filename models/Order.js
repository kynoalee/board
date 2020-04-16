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
    status : Number,
    
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
    ordernum:{
      type:Number,
      unique:true
    },
    filepath1:String,
    summary1:String,
    filepath2:String,
    summary2:String,
    filepath3:String,
    summary3:String,
    filepath4:String,
    summary4:String,
    filepath5:String,
    summary5:String,
    filepath6:String,
    summary6:String,
    wdate:{
      type:Date
    },
    mdate:{
      type:Date
    }
  });

// model & export
var Summary = mongoose.model('summary', orderSummarySchema);
var Detail = mongoose.model('detail', orderDetailSchema);
var Last = mongoose.model('last', orderLastSchema);

module.exports.Summary = Summary;
module.exports.Detail = Detail;
module.exports.Last = Last;

//