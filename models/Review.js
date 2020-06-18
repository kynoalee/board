var mongoose = require('mongoose');

// schema
var reviewSchema = mongoose.Schema({
  
});

// model & export
var Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
