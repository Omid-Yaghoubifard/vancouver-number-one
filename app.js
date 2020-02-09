                   require("dotenv").config();
const express    = require("express"),
      bodyParser = require("body-parser"),
      mongoose   = require("mongoose"),
      ejs        = require("ejs"),
      router     = require("./router.js"),
      session    = require("express-session"),
      passport   = require("passport");


const app = express();

mongoose.connect("mongodb://localhost:27017/Vancouver_is_beautiful", {useNewUrlParser: true, useUnifiedTopology: true});
app.set ("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(router);

app.listen(process.env.PORT || 3000, process.env.IP, function(){
    console.log("Server has started");
})