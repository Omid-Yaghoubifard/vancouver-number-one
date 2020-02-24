const express        = require("express"),
      router         = express.Router(),
      bodyParser     = require("body-parser"),
      multer         = require("multer"),
      passport       = require("passport"),
      methodOverride = require("method-override"),
      User           = require("./models/user"),
      Post           = require("./models/post");

// check isLoggedIn
function isLoggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect("/login");
    }
};

// check isNotLoggedIn
function isNotLoggedIn(req, res, next) {
    if (!req.user) {
        next();
    } else {
        res.redirect("/");
    }
};

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

// index
router.get("/index", function(req, res){
    Post.find({}, function(err, posts){
        if(!err){
            res.render("index", {posts: posts, user: req.user});
        } else{
            res.redirect("/");
        }
    })
});

// new
router.get("/index/new", isLoggedIn, function(req, res){
    res.render("new", {user: req.user});
});

// create
router.post("/index", isLoggedIn, upload.single("image"), function(req, res){
    let fullPost = req.body.newPost;
    fullPost.author = req.user._id;
    fullPost.image = req.file.path;
    Post.create(
        fullPost, function (err, post) { 
            if(err){
                res.redirect("/index/new")
            } else{
                res.redirect("/index");
            }
    });
});

// show
router.get("/index/:id", function(req, res){
    Post.findById(req.params.id).populate("author").exec(function(err, post){
        if(!err){
            res.render("show", {post: post, user: req.user});
        } else{
            res.redirect("/index");
        }
    })
});

// edit
router.get("/index/:id/edit", isLoggedIn, function(req, res){
    Post.findById(req.params.id).populate("author").exec(function(err, post){
        if(req.user.username === post.author[0].username){
            res.render("edit", {user: req.user, post: post})
        } else{
            res.redirect("/index/"+req.params.id);
    }})
});

// update
router.put("/index/:id", isLoggedIn, upload.single("image"), function(req, res){
    Post.findById(req.params.id).populate("author").exec(function(err, post){
        if(req.user.username === post.author[0].username){
            let editedPost = req.body.editPost;
                Post.findByIdAndUpdate(req.params.id, editedPost, function(err, modified){
                    if(req.file != undefined){
                        Post.findByIdAndUpdate(req.params.id, {image: req.file.path}, function(err, modifiedImage){
                            res.redirect("/index/"+req.params.id)
                        })   
                    }else{
                        res.redirect("/index/"+req.params.id);
        }})
        } else{
            res.redirect("/index/"+req.params.id);
    }
    })
});

// delete
router.get("/index/:id/delete", isLoggedIn, function(req,res){
    Post.findById(req.params.id).populate("author").exec(function(err, post){
        if(req.user.username === post.author[0].username){
            res.render("delete", {user: req.user, post: post})
        } else{
            res.redirect("/index/"+req.params.id);
        }
    })
});

router.delete("/index/:id", isLoggedIn, function(req,res){
    Post.findById(req.params.id).populate("author").exec(function(err, post){
        if(req.user.username === post.author[0].username){
            Post.findByIdAndRemove(req.params.id, function(err, post){
                if(err){
                    res.redirect("/index/"+req.params.id);
                } else{
                    res.redirect("/index");
                }
            });
        } else{
            res.redirect("/index/"+req.params.id);
        }
    })
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
          res.redirect("/");
        });
    }});
}});

//login
router.get("/login", isNotLoggedIn, function(req,res){
    res.render("login", {user: req.user});
});

router.post("/login", isNotLoggedIn, passport.authenticate("local", { 
    successRedirect:"/",
    failureRedirect: "/login"
}));

// logout
router.get("/logout", isLoggedIn, function(req,res){
    req.logout();
    res.redirect("/");
});

module.exports = router
