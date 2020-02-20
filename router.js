const express    = require("express"),
      router     = express.Router(),
      bodyParser = require("body-parser"),
      multer     = require("multer"),
      passport   = require("passport"),
      User       = require("./models/user"),
      Post       = require("./models/post");

// check isLoggedIn
function isLoggedIn(req, res, next) {
    // console.log(req.session);
    if (req.user) {
        next();
    } else {
        res.redirect("/login");
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
    res.render("home");
});

// index
router.get("/index", function(req, res){
    res.render("index");
})

// new
router.get("/index/new", isLoggedIn, function(req, res){
    res.render("new");
})

// create
router.post("/index", upload.single("image"), function(req, res){
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
    res.render("show");
})

// edit
router.get("/index/:id/edit", function(req, res){
    res.render("edit");
})

// update
router.put("/index/:id", function(req, res){
    res.render("home");
})

// delete
router.delete("/index/:id", function(req,res){
    res.render("home");
})

//signup
router.get("/signup", function(req,res){
    res.render("signup");
})

router.post("/signup", function(req, res) {
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
router.get("/login", function(req,res){
    res.render("login");
});

router.post("/login", passport.authenticate("local", { 
    successRedirect:"/",
    failureRedirect: "/login"
}));

// logout
router.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
});

// router.get("/secret", isLoggedIn, function(req,res){
//     res.send("This is the secret page!")
// });

module.exports = router
