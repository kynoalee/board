var mongoose = require('mongoose');

// schema
var orderSummarySchema = mongoose.Schema({
    
  });

var orderDetailSchema = mongoose.Schema({
    ordernum:{
      type:Number,
      unique:true,
      required:[true],
      trim:true
    },
    
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