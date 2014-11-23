var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var CommitSchema = new Schema({
  sha: {
    type: String,
    required: true,
    unique: true
  },
  author: {
      name: String,
      email: String,
      date: Date
  },
  message: String

});

var StorySchema = new Schema({
  project_id: Number,
  id: {
    type: String,
    unique: true,
    required: true
  },
  name: String,
  commits: [CommitSchema]
});

var ReleaseSchema = new Schema({
  label: { 
    type:String, 
    required: true, 
    unique: true
  },
  changeset: [StorySchema],
  released: {
    type: Boolean,
    default: false
  },
  created_at: { type: Date, default: Date.now }

}, {strict: 'throw'});

module.exports = mongoose.model('Story', StorySchema);
module.exports = mongoose.model('Commit', CommitSchema);
module.exports = mongoose.model('Release', ReleaseSchema);
