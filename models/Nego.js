var mongoose = require('mongoose');

// schema
var negoSchema = mongoose.Schema({

    negonum : {
        type:Number,
        unique:true
    },
    linkqnanum : Number,
    vender : String,
    customer : String,
    where : String,
    linknum : Number,

    // 네고 내용
    bPrice:Number,
    aPrice:Number,
    bDeadline:String,
    aDeadline:String, 

    status : String,
    // negotiating,accept,reject
    wdate : Date,
    mdate : Date
});

// model & export
var Nego = mongoose.model('nego', negoSchema);
module.exports = Nego;
