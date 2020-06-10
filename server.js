require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const fs = require('fs');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));



app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.URLEncoded({extended: true}));
mongoose.connect('mongodb://localhost:27017//yuriybelzdotcom') // pls put in the database name here i know i havent started it at the time of writing but it needs to be here eventually

const userSchema = new mongoose.Schema ({
  email:          String,
  paswordhash:    String,
  salt:           String,
  accountcreated: {type: Date, default: Date.now },
  admin:          {type: Boolean, default: false},
  userBlisted:    {type: Boolean, default: false},
  strikes:        {type: Number, default: 0},
  submissions:    Array,
  comments:       Array
});

const submissionSchema = new mongoose.Schema ({
  title:          String,
  description:    String,
  owner:          String,
  tags:           Array,
  submitcreated:  {type: Date, default: Date.now },
  comments:       Array
});

const commentSchema = new mongoose.Schema ({
  owner:           String,
  commentcreated:  {type: Date, default: Date.now },
  content:         String,
  blisted:         Boolean
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

/////////////////////////////////////////// GET Requests//////////////////////////////////

app.get('/', function(req,res){
  res.render('index')
});

app.get('/login', function(req,res){
  res.render('login');
});

app.get('/register', function(req,res){
  res.render('register');
});

app.get('/submissions' , function(req, res){
    Submission.find(function(err, foundSubmissions){
      if(err){
        console.log(err);
      }
      else{
        if (foundSubmissions){
          res.render('submissions', {allSubmissions: foundSubmissions});
        }
      }
    });
});

app.get('/submitnew', function(req,res){
  res.render('submitnew');
});

app.get('/submission', function(req, res){
  const URLsubmissionID = urlParams.get('ID');

});
///

app.post('/submitnew', function(req,res){
  /*this funciton will process incoming information for new posts, I should be
  only one that is the admin and and the only one that can ever see the new submission
  tab, on the new submission page it should have a form for the information of a New
  image, this would include images, the post title and the post description.
  when the information gets sent to the server it will check if the images are valid,
  if they are thew we will make a new post object in the database and a new folder
  in the file system with the id of the post and store the images there. When it
  is time to serve up the images it will look for the folder with name of the
  submission and show each image in the folder in a bootstrap carousel along
  with the text of the submission which will be stored in the database

  I researched how to store images from user submissions and stack overflow
  says that it is more efficient to use the filesystem as it is meant to operate with filesystem
  and how using a database like mongodb would create a bottleneck and have problems
  with files greater than 16mB*/

  res.render('/submissions');

});

app.post('/submission', function(req, res){


  res.redirect(req.get('referer'));
});

app.post('/register', function(req, res){

});

app.post('/login', function(req, res){

});


/////////////////////////////////////////// POST Requests//////////////////////////////////

app.listen(3000, function(){
  console.log('Cusrrently listening @ 3000')
})
