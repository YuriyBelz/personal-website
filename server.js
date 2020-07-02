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
const url = require('url');
const querystring = require('querystring');

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

/////////////////////////////////////////// Passport & mongoDB //////////////////////////////////

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({extended: true}));
mongoose.connect('mongodb://127.0.0.1:27017/yuriybelzdotcom')

/////////////////////////////////////////// Schemas //////////////////////////////////

const userSchema = new mongoose.Schema ({
  email:          String,
  googleId:       String,
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
const Submit = new mongoose.model("Submit", submissionSchema);
const Comment = new mongoose.model("Comment", commentSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/",
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
  res.render('index', {activePage: "index"})
});

app.get('/login', function(req,res){
  res.render('login', {activePage: "login"});
});

app.get('/register', function(req,res){
  res.render('register', {activePage: "register"});
});

app.get("/about", function(req, res){
  res.render("about", {activePage: "about"});
});

app.get('/submissions' , function(req, res){
    Submit.find( {}, null, {sort: {submitcreated: -1}} ,function(err, foundSubmissions){
      if(err){
        console.log(err);
      }
      else{
        if (foundSubmissions){
          //found submissions need to be sorted newest to oldest,
          res.render('submissions', {allSubmissions: foundSubmissions, activePage: "submissions"});
        }
      }
    });
});//this page features all blog articles/ submissions by me, clicking on one
  // should bring you to a page with the full content of an individual article

app.get('/submitnew', function(req,res){
  res.render('submitnew');
});

app.get('/submission/:selectedID', function(req, res){
  /*in the all submissions page each small small descriptopn has a link to the singular submission
  the Url will ivaluate to /submission/#### where the number is the database ID of the Document
  once found it will be passed in and displayed

  it might visually look better to have the title of the article in the URL and search the DB
  off of that but that might be bad practice because there might be duplicates*/
submit.findById(req.params.selectedID, function(err, foundDocument){
    if (err){
      console.log(err);
    } else {
      if (foundDocument){
        const imgNames = fs.readdirSync('./image_storage/' + foundDocument._id);
        res.render('submission', {selectedSubmission: foundDocument, selectedImages: imgNames, activePage: "submissions" });
      }
    }
})

});
/////////////////////////////////////////// POST Requests//////////////////////////////////

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
  with files greater than 16mB

  I should probably add some sort of validation here*/






  res.render('/submissions', {activePage: "submissions"});//when completed redirects to submissions page

});

app.post('/submission', function(req, res){

  res.redirect(req.get('referer'));
});

app.post('/register', function(req, res){
  User.register({username: req.body.email}, req.body.password, function(err, user){
  if (err) {
    console.log(err);
    res.redirect("/register");
  } else {
    passport.authenticate("local")(req, res, function(){
      res.redirect("/", {activePage: "index"});
    });
  }
});
});

app.post('/login', function(req, res){

  const user = new User({//temp user object is necessary
  email: req.body.email,
  password: req.body.password
});

req.login(user, function(err){
  if (err) {
    console.log(err);
    res.redirect("/login");
  } else {
    passport.authenticate("local")(req, res, function(){
      res.redirect("/", {activePage: "index"});
    });
  }
});

});


/////////////////////////////////////////// POST Requests//////////////////////////////////

app.listen(3000, function(){
  console.log('Currently listening @ 80')
})
