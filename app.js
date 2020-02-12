                              require("dotenv").config();
const express               = require("express"),
      bodyParser            = require("body-parser"),
      mongoose              = require("mongoose"),
      ejs                   = require("ejs"),
      router                = require("./router.js"),
      session               = require("express-session"),
      passport              = require("passport"),
      passportLocalMongoose = require("passport-local-mongoose"),
      LocalStrategy         = require("passport-local").Strategy;
      User                  = require("./models/user");

const app = express();

app.set ("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(router);

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
  }))

mongoose.connect("mongodb://localhost:27017/Vancouver_number_one", {useNewUrlParser: true, useUnifiedTopology: true});

passport.use(new LocalStrategy(User.authenticate()));
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.listen(process.env.PORT || 3000, process.env.IP, function(){
    console.log("Server has started");
})