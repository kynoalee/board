var mongoose = require('mongoose');

// schema
var bidSchema = mongoose.Schema({
  ordernum :Number,
  userid : String,
  vender : String,
  detail : Object,
  wdate : Date
});

// model & export
var Bid = mongoose.model('Bid', bidSchema);
module.exports = Bid;
