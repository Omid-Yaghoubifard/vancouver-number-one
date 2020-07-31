                       require("dotenv").config();
const express        = require("express"),
      bodyParser     = require("body-parser"),
      multer         = require("multer"),
      mongoose       = require("mongoose"),
      session        = require("express-session"),
      router         = require("./router"),
      passport       = require("passport"),
      methodOverride = require("method-override"),
      flash          = require("connect-flash"),
      cookieParser   = require("cookie-parser"),
      app            = express(),
      { errors }     = require("celebrate");

app.set ("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(["/index/public/images", "/index/show/public/images", "/public/images"], express.static(__dirname + "/public/images"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(cookieParser(process.env.COOKIEPARSER));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: "auto" }
}))

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/Vancouver_number_one", {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
mongoose.set("useFindAndModify", false);

app.use(router);
app.use(errors());
app.use(function (err, req, res, next) {
  if (err instanceof multer.MulterError) {
    res.status(500).send({ Error: "Expected file size: 200 KB to 750 KB | Expected file formats: jpeg, jpg, png, gif, tif, tiff" })
  } else next();
});

const User = require("./models/user");

passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.listen(process.env.PORT || 3000, process.env.IP, function(){
    console.log("Server has started");
})