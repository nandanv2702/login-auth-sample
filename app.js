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

app.get('/login', (req, res) => {
  res.render('login');
});

app.route('/register')
  .get(function(req, res) {
    res.render('register');
  })
  .post(function(req, res) {
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
      if (!err) {
        const newUser = new User({
          email: req.body.username,
          password: hash
        });

        newUser.save(function(err) {
          if (err) {
            console.log(err)
          };

          res.render('secrets');
        });
      } else {
        console.log(`there was an error: ${err}`);
        res.render('home');
      };
    });
  });

app.route('/login')
  .post(function(req, res) {
    const username = req.body.username;
    const pwd = req.body.password;

    User.findOne({
      email: username
    }, function(err, foundUser) {
      if (err) {
        console.log(err);
        res.render('home');
      } else {
        if (foundUser) {
          bcrypt.compare(pwd, foundUser.password, function(err, result) {
            if (result === true) {
              res.render('secrets');
            } else {
              console.log("wrong password");
              res.render('home');
            };
          });
        } else {
          console.log("we here");
          res.render('home');
        };
      };
    });
  });

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
