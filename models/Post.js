// models/Post.js

var mongoose = require('mongoose');

// schema
var postSchema = mongoose.Schema({ // 1
  title:{type:String, required:[true,'Title is required!']}, // 1
  body:{type:String, required:[true,'Body is required!']},   // 1
  createdAt:{type:Date, default:Date.now}, // 2
  updatedAt:{type:Date},
});

// model & export
var Post = mongoose.model('post', postSchema);
module.exports = Post;
