var mongoose = require('mongoose');

// schema
var bidSchema = mongoose.Schema({
  ordernum :Number,
  userid : String,
  vender : String,
  detail : Object,
  wdate : Date
});

var bidDoneSchema = mongoose.Schema({
  ordernum : Number,
  userid : String,
  vender  : String,
  detail : Object,
  wdate : Date,
  donedate : Date,
  status : String
});

// model & export
var Ing = mongoose.model('Bid', bidSchema);
var Done = mongoose.model('BidDone',bidDoneSchema);

module.exports.Ing = Ing;
module.exports.Done = Done;
