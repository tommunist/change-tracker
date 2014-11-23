var express    = require('express'); 
var bodyParser = require('body-parser');
var app        = express();   
var request = require('request');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8088;    // set our port
var router = express.Router();        // get an instance of the express Router
var github_url = 'https://api.github.com/repos/intentmedia/code/compare/'
var github_access_token = '84cffd7651f57ebd98df72b341f401b443764464'

router.route('/diffs/:current/:future')
  .get(function(req, res) {
    console.log('Diffs between ' + req.params.current + ' and ' + req.params.future);
    var url = github_url + req.params.current + '...' + req.params.future + '?access_token=' + github_access_token
    console.log(url);
    request.get({
      url: url, 
      headers: { 'User-Agent': 'tommunist' },
      json: true
    }, function(error, response, body) {
        var commits = [];
        var stories =  {};
        for(var i=0; i<body.commits.length; i++) {
          var commit = body.commits[i];
          var match = /\[\#([0-9]+)\]/.exec(commit.commit.message);
          var story_id = match ? match[1] : 'untracked';
          stories[story_id] = stories[story_id] || [];
          stories[story_id].unshift({sha: commit.sha, author: commit.commit.author,message: commit.commit.message});
          commits.unshift({
            sha: commit.sha, 
            author: commit.commit.author,
            message: commit.commit.message
          })
        }
        res.send({ commits: commits, stories: stories});
    });
    
  });

app.use('/api', router);
router.use(function(req, res, next) {
  console.log('meow meow.');
  next(); 
})
// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
  res.json({ message: 'hooray! welcome to our api!' }); 
});

app.listen(port);
console.log('Meow meow on ' + port);