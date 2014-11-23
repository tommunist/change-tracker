// server.js

// modules =================================================
var express        = require('express');
var app            = express();
var bodyParser     = require('body-parser');


// configuration ===========================================
    
// config files

// set our port
var port = process.env.PORT || 8000; 
app.use(bodyParser.json()); 

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); 

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true })); 

// set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/public')); 

// routes ==================================================
app.get('*', function(req, res) {
  res.sendfile('./public/views/index.html'); // load our public/index.html file
});

app.listen(port);               

// shoutout to the user                     
console.log(' ' + port);

// expose app           
exports = module.exports = app;                         
