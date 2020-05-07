var mongoose = require('mongoose');

// schema
var bidSchema = mongoose.Schema({
  bidnum:{
    type:Number,
    unique:true
  },
  ordernum :Number,
  userid : String,
  vender : String,
  detail : Object,
  status : String, 
  // bidding, select, reject, delete
  // (입찰, 선정, 거절, 삭제)
  wdate : Date,
  mdate : Date,
  donedate : Date
});

// model & export
var Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid;
