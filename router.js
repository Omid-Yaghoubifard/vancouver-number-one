const express        = require("express"),
      router         = express.Router(),
      bodyParser     = require("body-parser"),
      multer         = require("multer"),
      passport       = require("passport"),
      methodOverride = require("method-override"),
      User           = require("./models/user"),
      Post           = require("./models/post"),
      fetch          = require("node-fetch"),
      Comment        = require("./models/comment");

// check isLoggedIn
function isLoggedIn(req, res, next){
    if (req.user){
        next();
    } else{
        res.redirect("/login");
    }
};

// check isNotLoggedIn
function isNotLoggedIn(req, res, next){
    if (!req.user){
        next();
    } else{
        res.redirect("/index/1");
    }
};

// check loggedInUser
function loggedInUser(req, res, next){
    Post.findById(req.params.id).populate("author").exec(function(err, post){
        if(req.user.username === post.author[0].username){
            next();
        } else{
            res.redirect("/index/show/"+req.params.id);
        }
})};

// image storage
const Storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, "./public/images");
    },
    filename: function(req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({storage: Storage});

// homepage
router.get("/", function(req, res) {
    res.render("home", {user: req.user});   
});

// new
router.get("/index/new", isLoggedIn, function(req, res){
    res.render("new", {user: req.user});
});

// index
router.get("/index/:page", function(req, res, next) {
    const perPage = 12;
    const page = req.params.page || 1;

    Post
        .find(req.query || {})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function(err, posts) {
            Post.countDocuments().exec(function(err, count) {
                if (err) return next(err)
                res.render("index", {
                    posts: posts,
                    current: page,
                    pages: Math.ceil(count / perPage),
                    user: req.user
                })
            })
        })
});

// create
router.post("/index", isLoggedIn, upload.single("image"), function(req, res){
    fetch("https://api.mapbox.com/geocoding/v5/mapbox.places/" + req.body.newPost.title + ".json?types=poi&proximity=-123.13060,49.28562&limit=1&country=CA&access_token=" + process.env.MAPAPI)
    .then(response => response.json())
    .then(data => data.features[0].center)
    .then(coordinates => {
        let fullPost = req.body.newPost;
        fullPost.author = req.user._id;
        fullPost.image = req.file.path;
        fullPost.location = coordinates;
        return fullPost
    })
    .then(fullPost => Post.create(fullPost, function (err, post) { 
        if(err){
            res.redirect("/index/new")   
        } else{
            res.redirect("/index/1");
        }
    }));
});

// show
router.get("/index/show/:id", function(req, res){
    Post.findById(req.params.id).populate("author").populate({path:"comments", populate: {path: "author", model: "User"}}).exec(function(err, post){
        if(!err){
            res.render("show", {post: post, user: req.user, WEATHERAPI: process.env.WEATHERAPI, MAP: process.env.MAPAPI});
        } else{
            res.redirect("/index/1");
        }
    })
});

//navbar search
router.post("/index/1", function(req, res){
    Post.findOne({title: new RegExp(req.body.search, "i")}).exec(function(err, post){
        if(!post || err){
            res.redirect("/index/1");
        } else{
            res.redirect("/index/show/"+post._id);
        }
    })
});

// edit
router.get("/index/show/:id/edit", isLoggedIn, loggedInUser, function(req, res){
    Post.findById(req.params.id).populate("author").exec(function(err, post){
        res.render("edit", {user: req.user, post: post})
    })
});

// update
router.put("/index/show/:id", isLoggedIn, loggedInUser, upload.single("image"), function(req, res){
    let editedPost = req.body.editPost;
    Post.findByIdAndUpdate(req.params.id, editedPost, function(err, modified){
        if(req.file != undefined){
            Post.findByIdAndUpdate(req.params.id, {image: req.file.path}, function(err, modifiedImage){
                res.redirect("/index/show/"+req.params.id)
            })   
        }else{
            res.redirect("/index/show/"+req.params.id);
    }
    })
});

//comment
router.post("/index/show/:id", isLoggedIn, function(req,res){
    let newComment = req.body.newComment;
    newComment.author = req.user._id;
    Comment.create(
        newComment, function(err, createdComment){
            if(!err){
                Post.findByIdAndUpdate(req.params.id, {$push: {comments: createdComment._id}}, function(err, updated){
                    res.redirect("/index/show/"+req.params.id);
                })
            } else{
                res.redirect("/index/show/"+req.params.id);
    }})
});

// delete
router.get("/index/show/:id/delete", isLoggedIn, loggedInUser, function(req,res){
    Post.findById(req.params.id).populate("author").exec(function(err, post){
        res.render("delete", {user: req.user, post: post})
    })
});

router.delete("/index/show/:id", isLoggedIn, loggedInUser, function(req,res){
    Post.findByIdAndRemove(req.params.id, function(err, post){
        if(err){
            res.redirect("/index/show/"+req.params.id);
        } else{
            res.redirect("/index/1");
        }
    });
});

//signup
router.get("/signup", isNotLoggedIn, function(req,res){
    res.render("signup", {user: req.user});
});

router.post("/signup", isNotLoggedIn, function(req, res) {
    if(req.body.password != req.body.password2) {
        res.redirect("/signup");
    } else {
    User.register(new User({ username : req.body.username }), req.body.password, function(err, newUser) {
        if (err) {
            console.log(err);
            res.render("signup", {info: "Sorry. That username already exists. Try again."});
        } else {
        User.findOne({ username:req.body.username }, function (err, foundUser) {
            if (err) {
                console.log(err);
            } else
                foundUser.email = req.body.email;
                foundUser.save();
        })
        passport.authenticate("local")(req, res, function () {
          res.redirect("/index/1");
        });
    }});
}});

//login
router.get("/login", isNotLoggedIn, function(req,res){
    res.render("login", {user: req.user});
});

router.post("/login", isNotLoggedIn, passport.authenticate("local", { 
    successRedirect:"/index/1",
    failureRedirect: "/login"
}));

// logout
router.get("/logout", isLoggedIn, function(req,res){
    req.logout();
    res.redirect("/");
});

module.exports = router
