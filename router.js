const express                              = require("express"),
      router                               = express.Router(),
      bodyParser                           = require("body-parser"),
      multer                               = require("multer"),
      passport                             = require("passport"),
      methodOverride                       = require("method-override"),
      User                                 = require("./models/user"),
      Post                                 = require("./models/post"),
      Comment                              = require("./models/comment"),
      fetch                                = require("node-fetch"),
      flash                                = require("connect-flash"),
      cookieParser                         = require("cookie-parser"),
      { celebrate, Joi, errors, Segments } = require("celebrate");


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

const upload = multer({
    storage: Storage,
    fileFilter:(req,file,cb) => {
        let extname = file.originalname.toLowerCase().match(/.(jpeg|jpg|png|gif|gif|tif|tiff)$/);
        let mimetype = file.mimetype.match(/(jpeg|jpg|png|gif|gif|tif|tiff)$/);
        if(mimetype && extname) cb(null,true);
        else cb(new multer.MulterError ("Error: Images Only"));
    },
    limits: {fileSize: 750000},
});

// homepage
router.get("/", function(req, res) {
    res.render("home", {
        user: req.user,
    });
});

// new
router.get("/index/new", isLoggedIn, function(req, res){
    res.render("new", {user: req.user, message1: req.flash("postFailed")
    });
});

// index
router.get("/index/:page", function(req, res, next) {
    const perPage = 12;
    const page = req.params.page || 1;
    if ("category" in req.query){
        var search = "?category=" + req.query.category;
    } else{
        var search = "";
    };
    Post
        .find(req.query || {})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function(err, posts) {
            Post.countDocuments(req.query || {}).exec(function(err, count) {
                if (err) return next(err)
                res.render("index", {
                    posts: posts,
                    current: page,
                    pages: Math.ceil(count / perPage),
                    user: req.user,
                    search: search,
                    messages: [req.flash("postCreated"), req.flash("noMatch"), req.flash("errorMessage"), req.flash("deleted"), req.flash("userSignedUp"), req.flash("profileFailed"), req.flash("loggedOut")]
                })
            })
        })
});

// create
router.post("/index", isLoggedIn, upload.single("image"),
    celebrate({
        body: Joi.object().keys({
            title: Joi.string().max(100).uppercase().required(),
            body: Joi.string().max(5000).required(),
            category: Joi.string().valid("Natural", "Cultural", "Events", "Man-Made").required(),
            url: Joi.string().uri().trim().required(),
        }),
    }),
    function(req, res){
    fetch("https://api.mapbox.com/geocoding/v5/mapbox.places/" + req.body.title + ".json?types=poi&proximity=-123.13060,49.28562&limit=1&country=CA&access_token=" + process.env.MAPAPI)
    .then(response => response.json())
    .then(data => data.features[0].center)
    .then(coordinates => {
        let fullPost = {
        title: req.body.title,
        body: req.body.body,
        category: req.body.category,
        url: req.body.url,
        author: req.user._id,
        image: req.file.path,
        location: coordinates
        }
        return fullPost
    })
    .then(fullPost => Post.create(fullPost, function (err, post) { 
        if(err){
            req.flash("postFailed", "Sorry. That title already exists.");
            res.redirect("/index/new")   
        } else{
            req.flash("postCreated", "Well done! Your post was succesfully created.");
            res.redirect("/index/1");
        }
    }));
});

// show
router.get("/index/show/:id", function(req, res){
    Post.findById(req.params.id).populate("author").populate({path:"comments", populate: {path: "author", model: "User"}}).exec(function(err, post){
        if(!err){
            res.render("show", {
                post: post, 
                user: req.user, 
                WEATHERAPI: process.env.WEATHERAPI, 
                MAP: process.env.MAPAPI,
                messages: [req.flash("updated"), req.flash("deleteError")]  
            });
        } else{
            req.flash("errorMessage", "Sorry. There was an error. Please try again");
            res.redirect("/index/1");
        }
    })
});

//navbar search
router.post("/index/1",
    celebrate({
        body: Joi.object().keys({
            search: Joi.string().max(100).uppercase().required(),
        }),
    }),
    function(req, res){
        Post.findOne({title: new RegExp(req.body.search, "i")}).exec(function(err, post){
            if(!post || err){
                req.flash("noMatch", "Sorry. There was no result that matched your search query.");
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
router.put("/index/show/:id", isLoggedIn, loggedInUser, upload.single("image"),
    celebrate({
        body: Joi.object().keys({
            title: Joi.string().max(100).uppercase().required(),
            body: Joi.string().max(5000).required(),
            category: Joi.string().valid("Natural", "Cultural", "Events", "Man-Made").required(),
            url: Joi.string().uri().trim().required(),
        }),
    }),
    function(req, res){
        fetch("https://api.mapbox.com/geocoding/v5/mapbox.places/" + req.body.title + ".json?types=poi&proximity=-123.13060,49.28562&limit=1&country=CA&access_token=" + process.env.MAPAPI)
        .then(response => response.json())
        .then(data => data.features[0].center)
        .then(coordinates => {
        let editedPost = {
            title: req.body.title,
            body: req.body.body,
            category: req.body.category,
            url: req.body.url,
            location: coordinates
            }
        return editedPost
        })
        .then(editedPost => Post.findByIdAndUpdate(req.params.id, editedPost, function(err, modified){
            if(req.file != undefined){
                Post.findByIdAndUpdate(req.params.id, {image: req.file.path}, function(err, modifiedImage){
                    req.flash("updated", "Well done! Your post was successfully updated.");
                    res.redirect("/index/show/"+req.params.id)
                })   
            }else{
                req.flash("updated", "Well done! Your post was successfully updated.");
                res.redirect("/index/show/"+req.params.id);
            }
        }))
});

//comment
router.post("/index/show/:id", isLoggedIn,
    celebrate({
        body: Joi.object().keys({
            text: Joi.string().max(1000).required(),
        }),
    }),
    function(req,res){
        let newComment = {
            text: req.body.text,
            author: req.user._id
        }
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
            req.flash("deleteError", "Sorry. There was an error deleting the post");
            res.redirect("/index/show/"+req.params.id);
        } else{
            req.flash("deleted", "Your post was successfully deleted.");
            res.redirect("/index/1");
        }
    });
});

//signup
router.get("/signup", isNotLoggedIn, function(req,res){
    res.render("signup", {
        user: req.user,
        messages: [req.flash("passwordMatch"), req.flash("signUpError")]
    });
});

router.post("/signup", isNotLoggedIn,
    celebrate({
        body: Joi.object().keys({
            username: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().lowercase().required(),
            password: Joi.string().min(8).max(256).required(),
            password2: Joi.string().min(8).max(256).required(),
        }),
    }),
    function(req, res) {
        if(req.body.password != req.body.password2) {
            req.flash("passwordMatch", "Please make sure you enter the same password twice.");
            res.redirect("/signup");
        } else {
        User.register(new User({ username : req.body.username }), req.body.password, function(err, newUser) {
            if (err) {
                req.flash("signUpError", "Sorry. That username already exists. Please try another username.");
                res.redirect("/signup");
            } else {
            User.findOne({ username:req.body.username }, function (err, foundUser) {
                if (err) {
                    console.log(err);
                } else
                    foundUser.email = req.body.email;
                    foundUser.save();
            })
            passport.authenticate("local")(req, res, function () {
                req.flash("userSignedUp", "Congratulations! Your account was created successfully.");
                res.redirect("/index/1");
            });
        }});
}});

//login
router.get("/login", isNotLoggedIn, function(req,res){
    res.render("login", {
        user: req.user,
        message1: req.flash("failedLogIn")
    });
});

router.post("/login", isNotLoggedIn,
    celebrate({
        body: Joi.object().keys({
            username: Joi.string().min(3).max(30).required(),
            password: Joi.string().min(8).max(256).required(),
        }),
    }),
    passport.authenticate("local", {failureRedirect: "/loginfailed"}),
    function(req, res) {
        res.redirect("/index/1");
});

router.get("/loginfailed", isNotLoggedIn, function(req, res){
    req.flash("failedLogIn", "Login failed! The username or password is incorrect.");
    res.redirect("/login");
});

//profile
router.get("/profile", isLoggedIn, function(req,res){
    Post.find({author: req.user._id}).populate("author").exec(function (err, posts){
        if(!err && req.user){
            res.render("profile", {
                user:req.user, 
                posts:posts,
                message1: req.flash("passwordChange") 
            });
        }
        else{
            req.flash("profileFailed", "There was an error loading the profile page. Please try again.");
            res.redirect("index/1")
        }
    })
});        

router.get("/profile/edit", isLoggedIn, function(req,res){
    res.render("profileEdit", {
        user: req.user,
        messages: [req.flash("passwordMatch"), req.flash("passwordChangeError")]
    });
});

router.post("/profile", isLoggedIn, 
    celebrate({
        body: Joi.object().keys({
            password: Joi.string().min(8).max(256).required(),
            password2: Joi.string().min(8).max(256).required(),
        }),
    }),
    function(req, res) {
        if(req.body.password != req.body.password2) {
            req.flash("passwordMatch", "Please make sure you enter the same password twice.");
            res.redirect("/profile/edit");
        } else {
            User.findOne({username: req.user.username}).then(function(user){
                if (user){
                    user.setPassword(req.body.password, function(err){
                        user.save();
                        req.flash("passwordChange", "You have successfully changed your password.");
                        res.redirect("/profile");
                    });
                } else {
                    req.flash("passwordChangeError", "There was an error. Please try again");
                    res.redirect("/profile/edit");
                }
            })
}});

// logout
router.get("/logout", isLoggedIn, function(req, res){
    req.logout();
    req.flash("loggedOut", "You have succesfully logged out!");
    res.redirect("/index/1");
});

// 404
router.get("*", function(req, res){
    res.render("404")
});

module.exports = router
