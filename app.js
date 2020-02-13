                              require("dotenv").config();
const express               = require("express"),
      bodyParser            = require("body-parser"),
      mongoose              = require("mongoose"),
      ejs                   = require("ejs"),
      session               = require("express-session"),
      router                = require("./router"),
      passport              = require("passport"),
      passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set ("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: "auto" }
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/Vancouver_number_one", {useNewUrlParser: true, useUnifiedTopology: true});

app.use(router);

const User = require("./models/user");

passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.listen(process.env.PORT || 3000, process.env.IP, function(){
    console.log("Server has started");
})