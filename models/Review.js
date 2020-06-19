var mongoose = require('mongoose');

// schema
var reviewSchema = mongoose.Schema({
  userid:String,
  
  ordernum:Number,
  wdate:Date,
  filelink:Array,
  summary:String,
  description:String
  
});

// model & export
var Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
