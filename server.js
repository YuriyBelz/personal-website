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
mongoose.connect('mongodb://localhost:27017//') // pls put in the database name here i know i havent started it at the time of writing but it needs to be here eventually


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

app.get('/', function(req,res){
  res.render('index')
});

app.get('/login', function(req,res){
  res.render('login');
});

app.get('/register', function(req,res){
  res.render('register');
});

app.get('/submissions', function(req,res){
  res.render('submissions');
});



app.listen(3000, function(){
  console.log('Cusrrently listening @ 3000')
})
