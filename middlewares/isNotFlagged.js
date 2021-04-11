const Post = require("../models/post.js");
const user = require("../models/user.js");

function isNotFlagged(req, res, next){
    if(!req.user.flagged){
        next();
    } else{
        res.redirect("/index/1?order=views&direction=-1");
    }
};

module.exports = isNotFlagged;