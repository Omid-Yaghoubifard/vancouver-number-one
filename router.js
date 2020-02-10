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
    res.redirect("/");
})

//login
router.get("/login", function(req,res){
    res.render("login");
})

router.post("/login", function(req,res){
    res.redirect("/");
})

module.exports = router

