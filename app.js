//jshint esversion:6
const bcrypt = require('bcrypt');
const saltRounds = 10;
const bodyParser = require('body-parser');
const ejs = require('ejs');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const port = process.env.PORT || 3000;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "some secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/secrets', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('secrets');
  } else {
    res.redirect('/login');
  };
});

app.route('/register')
  .get(function(req, res) {
    res.render('register');
  })
  .post(function(req, res) {
    User.register({
      username: req.body.username
    }, req.body.password, function(err, user) {
      if (err) {
        console.log('error during registration');
        res.redirect('/register');
      } else {
        passport.authenticate('local')(req, res, function() {
          res.redirect('secrets');
        });
      };
    });
  });

app.route('/login')
  .get(function(req,res){
    res.render('login');
  })
  .post(function(req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function(err){
      if(err){
        console.log(`error during login: ${err}`);
        res.redirect('/')
      } else {
        passport.authenticate('local')(req, res, function() {
          res.redirect('secrets');
        });
      }
    });
  });

app.get('/logout', function(req,res){
  req.logout();
  res.redirect('/');
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
