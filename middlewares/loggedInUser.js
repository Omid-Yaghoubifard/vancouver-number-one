const Post = require("../models/post.js");

function loggedInUser(req, res, next){
    Post.findById(req.params.id).populate("author").exec(function(err, post){
        if(req.user.username === post.author[0].username){
            next();
        } else{
            req.flash("notYourPost", "Sorry. You have not created this post.");
            res.redirect("/index/show/"+req.params.id);
        }
    })
};

module.exports = loggedInUser;