const Post = require("../models/post.js");
const user = require("../models/user.js");

function loggedInUser(req, res, next){
    Post.findById(req.params.id).populate("author").exec(function(err, post){
        if((req.user.username === post.author[0].username && !req.user.flagged) || req.user.username === "Admin"){
            next();
        } else{
            req.flash("notYourPost", "You do not have permission to access that page.");
            res.redirect("/index/show/"+req.params.id);
        }
    })
};

module.exports = loggedInUser;