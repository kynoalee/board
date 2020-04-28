var mongoose = require('mongoose');

// schema
var logSchema = mongoose.Schema({
  document_name : String,
  type : String,
  contents : Object,
  wdate : Date
});

// model & export
var Log = mongoose.model('Log', logSchema);
module.exports = Log;
