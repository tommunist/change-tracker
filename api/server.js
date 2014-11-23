var express    = require('express'); 
var bodyParser = require('body-parser');
var app        = express();   
var mongoose   = require('mongoose');
var request = require('request');
var async = require('async');
var Release       = require('./app/models/release');

mongoose.connect('mongodb://app:fatonmat@proximus.modulusmongo.net:27017/E5barune')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      next();
    });
var pivotal_token = 'd900f4cfc5777cffe2bad7f7008f56d5'
var port = process.env.PORT || 8080;    // set our port
var router = express.Router();        // get an instance of the express Router


router.route('/release/:candidate_build/create/:previous')
  .post(function(req, res) {
    console.log('creating release candidate');
    
    request.get({
        url: 'http://localhost:8088/api/diffs/' + req.params.previous + '/' + req.params.candidate_build,
        json: true
      }, function(error, response, body) {
        var release = new Release({
              label: req.params.candidate_build              
        });
        
            
        if (error)
          res.send(error);
         
        async.each(
          Object.keys(body.stories),
          function(story_id, callback){
            var story = {id: story_id};
            story.commits = body.stories[story_id];
            
            console.log('Processing story #' + story.id);

            if(story_id !== 'untracked') {
                request.get(
                    {
                        url: 'https://www.pivotaltracker.com/services/v5/stories/' + story_id,
                        headers: { 'X-TrackerToken': pivotal_token },
                        json: true
                    }, function (err, pivotalResponse, pivotalBody) {

                        console.log("Got response for " + story_id);
                        if(err) {
                            console.log(err);
                        }
                        story.project_id = pivotalBody.project_id;
                        story.name = pivotalBody.name;
                        release.changeset.push(story);
                        callback();
                    }
                );
            } else {
                console.log("Ignoring untracked");
                release.changeset.push(story);
                callback();
            }

          },
          function(err){
            console.log('FINISHED!');
            if(err) {
                console.log(err);
                res.send(err);
            }
            
            console.log(release.created_at);

            release.save(function (err) {if (err) console.log ('ERROR: ' + err)});
            res.send(release);
          }  
        );
      
      });
        
    }
  
);
router.route('/releases/latest-deployed')
  .get(function(req, res) {
    Release.findOne({released:true}, {}, { sort: { 'created_at' : -1 } }, function(err, release) {
      console.log( release );
      res.json(release);
    });
   });

router.route('/meow/:story/:message')
  .post(function(req, res) {
    var url = 'https://www.pivotaltracker.com/services/v5/projects/15003/stories/' + req.params.story + '/labels';
    console.log(url);            
    request.post({
      headers: { 'X-TrackerToken': pivotal_token },
      json: true,
      url: url,
      form: { name: 'meow' + req.params.message}
    }, function(err, pivotalResponse, pivotalBody) {
      if(err)
        console.log(err);
      console.log(pivotalBody);
      res.json({message: 'OK'});
    })
  });

router.route('/releases')
  .get(function(req, res) {
    console.log('finding all releases');
    Release.find(function(err, releases) {
      if (err)
        res.send(err);

      res.json(releases);
    });
  });
router.route('/release/:release_label')
  .get(function(req, res) {
    Release.findOne({label: req.params.release_label}, function(err, release) {
      if (err)
        res.send(err);
      res.json(release);
    });
  })
  .delete(function(req, res) {
    Release.remove({
      label: req.params.release_label
    }, function(err, release) {
      if (err)
        res.send(err);

      res.json({ message: 'Successfully deleted ' + req.params.release_label });
    });
  });
router.route('/release/:release_label/activate')
  .post(function(req, res) {
    var release =  {}
    console.log('activating ' + req.params.release_label);
    Release.findOneAndUpdate(
      { label: req.params.release_label }, 
      { released: true },
      function(err, release) {
        console.log('RELEASE MEOW');
        async.each(release.changeset,
          function(story, callback) {
            console.log('Notifying story ' + story.id);
            var url = 'https://www.pivotaltracker.com/services/v5/projects/' + story.project_id + '/stories/' + story.id + '/comments';
            console.log(url);            
            request.post({
              headers: { 'X-TrackerToken': pivotal_token },
              json: true,
              url: url,
              form: { text: 'Released in ' + release.label}
            }, function(err, pivotalResponse, pivotalBody) {
              console.log(pivotalBody);
              callback(err);  
            })
            
          },
          function(err) {
            if(err)
              console.log(err);
            request.post({
              url: 'https://hooks.slack.com/services/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',
              form: {
                "payload": JSON.stringify({
                  "text": req.params.release_label + " released [<http://localhost:8080/api/release/" + req.params.release_label + "|changeset>]" 
                })
              }
            },
             function(err, slackResponse) {
               if(err)
                 console.log(err);
               console.log('Notified all story observers!')
               res.json({message: 'Release activated: ' + req.params.release_label});          
               
             });
          }
        );
        
      }
    );

    
  });
router.route('')
app.use('/api', router);
router.use(function(req, res, next) {
  console.log('meow meow.');
  next(); 
})
// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
  res.json({ message: 'hooray! welcome to our api!' }); 
});

// more routes for our API will happen here
app.use(express.static(__dirname + 'web/public')); 
app.get('/changesets', function(req, res) {
  res.sendfile('./changeset.html');
});
app.get('/changesets2', function(req, res) {
  res.sendfile('./web/public/views/index.html');
});

app.listen(port);
console.log('Meow meow on ' + port);
