const express = require("express"),
      router  = express.Router();

// homepage
router.get("/", function(req, res) {
    res.render("home");
});

// index
router.get("/index", function(req, res){
    res.render("index");
})

// new
router.get("/index/new", function(req, res){
    res.render("new");
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

router.post("/signup", function(req,res){
    if(req.body.password1 != req.body.password2) {
        res.redirect("/signup");
    } else {
        User.register({username:req.body.email}, req.body.password1, function(err, user) {
        if(err) 
            {console.log(err);
        }
        const authenticate = User.authenticate();
        authenticate("username", "password", function(err, result) {
          if (err) {console.log(err)} else {
            res.redirect("/");
          }
        });
    });
}})

//login
router.get("/login", function(req,res){
    res.render("login");
})

router.post("/login", function(req,res){
    const authenticate = User.authenticate();
    authenticate("username", "password", function(err, result) {
    if (err){
        console.log(err);
    } else {
        res.redirect("/index");
    }
   });
});

module.exports = router

