var mongoose = require('mongoose');

// schema
var negoSchema = mongoose.Schema({

    linkqnanum : Number,
    where : String,
    linknum : Number,

    // 네고 내용
    price:Number,
    deadline:String,

    status : String,
    wdate : Date
});

// model & export
var Nego = mongoose.model('nego', negoSchema);
module.exports = Nego;
