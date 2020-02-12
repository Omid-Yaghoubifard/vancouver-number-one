const mongoose              = require("mongoose"),
      passportLocalMongoose = require("passport-local-mongoose");

const User = new mongoose.Schema({
    username: String,
    password: String
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", User);