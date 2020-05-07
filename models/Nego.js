var mongoose = require('mongoose');

// schema
var negoSchema = mongoose.Schema({
});

// model & export
var Nego = mongoose.model('nego', negoSchema);
module.exports = Nego;
