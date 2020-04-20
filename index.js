// index.js

var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash'); // 1
var session = require('express-session'); // 1
var passport = require('./config/passport'); //1
var config = require('./config/config')
var app = express();

// DB setting
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(config.db.mongo.test);
var db = mongoose.connection;
db.once('open', function(){
  console.log('DB connected');
});
db.on('error', function(err){
  console.log('DB ERROR : ', err);
});
// Other settings
app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));
app.use(express.static("../files"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(flash());
app.use(session({secret:'MySecret', resave:true, saveUninitialized:true}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Custom Middlewares
app.use(function(req,res,next){
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  next();
});

// Routes
app.use('/', require('./routes/home'));
// app.use('/posts', require('./routes/posts'));
app.use('/users', require('./routes/users'));
app.use('/order',require('./routes/order'));
app.use('/download',require('./routes/download'));
app.use('/pop',require('./routes/pop'));

// Port setting
var port = 3000;
app.listen(port, function(){
  console.log('server on! http://localhost:'+port);
});