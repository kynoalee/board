var mongoose = require('mongoose');

// schema
var reviewSchema = mongoose.Schema({
  rnum:{
    type:Number,
    unique:true
  },
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
