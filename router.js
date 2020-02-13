const express  = require("express"),
      router   = express.Router(),
      passport = require("passport"),
      User     = require("./models/user");

// check isLoggedIn
function isLoggedIn(req, res, next) {
    console.log(req.session);
    if (req.user) {
        next();
    } else {
        res.redirect("/login");
    }
};

// homepage
router.get("/", function(req, res) {
    res.render("home");
});

// index
router.get("/index", function(req, res){
    res.render("index");
})

// new
// router.get("/index/new", isLoggedIn, function(req, res){
//     res.render("new");
// })

router.get("/index/new", isLoggedIn, function(req, res){
    res.redirect("/secret");
})

// create
router.post("/index", function(req, res){

    res.redirect("/index");
})

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
          res.redirect("/secret");
        });
    }});
}});

//login
router.get("/login", function(req,res){
    res.render("login");
});

router.post("/login", function(req,res){
    passport.authenticate("local")(req, res, function () {
    res.redirect("/secret");
    })
});


// logout
router.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
});

router.get("/secret", isLoggedIn, function(req,res){
    res.send("This is the secret page!")
});

module.exports = router
