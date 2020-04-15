var mongoose = require('mongoose');

// schema
var fileSchema = mongoose.Schema({
    // originname, filename, uploadid,filetype,udate
    originname:{
        type:String,
        trim:true
    },
    servername:{
        type:String,
        unique:true,
        trim:true
    },
    filepath:{
        type:String,
        trim:true,
        unique:true
    },
    uploadid:{
        type:String
    },
    filetype:{
        type:String
    },
    udate:{
        type:Date,
        default:Date()
    }
});
  
  // model & export
  var File = mongoose.model('file', fileSchema);
  module.exports = File;