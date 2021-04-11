const express            = require("express"),
      router             = express.Router(),
      passport           = require("passport"),
      User               = require("./models/user"),
      Post               = require("./models/post"),
      Comment            = require("./models/comment"),
      isLoggedIn         = require("./middlewares/isLoggedIn"),
      isNotLoggedIn      = require("./middlewares/isNotLoggedIn"),
      isNotFlagged       = require("./middlewares/isNotFlagged"),
      loggedInUser       = require("./middlewares/loggedInUser"),
      isAdmin            = require("./middlewares/isAdmin"),
      upload             = require("./middlewares/upload"),
      fetch              = require("node-fetch"),
      { celebrate, Joi } = require("celebrate"),
      Filter             = require('bad-words'),
      filter             = new Filter(),
      nodemailer         = require("nodemailer"),
      fs                 = require("fs");



// homepage
router.get("/", (req, res) =>{
    let path = req.route.path;
    res.render("home", {
        user: req.user,
        path
    });
});

// new
router.get("/index/new", isLoggedIn, isNotFlagged, (req, res) =>{
    let path = req.route.path;
    res.render("new", {
        user: req.user,
        path,
        messages: [req.flash("postFailed"), req.flash("titleError")]
    });
});

// index
router.get("/index/:page", (req, res, next) =>{
    let path = req.route.path;
    const perPage = 12;
    const page = Number(req.params.page) || 1;
    let originalUrl = req.originalUrl;
    let search;
    "category" in req.query ? search = `&category=${req.query.category}` : search = "";
    let sort = req.query.order || "views"
    let sortBy = `?order=${sort}`;
    let sortDirect = parseInt(req.query.direction) || -1
    let direc = `&direction=${sortDirect}`;
    let searchTitle;
    if (sort === "views") {
        searchTitle = "Most Viewed"
    } else if (sort === "rating") {
        searchTitle = "Top Rated"
    } else if (sort === "date" && sortDirect === -1) {
        searchTitle = "Newest"
    } else if (sort === "date" && sortDirect === 1) {
        searchTitle = "Oldest"
    }
    Post
        .find(req.query.category ? {category : req.query.category} : {})
        .find({verified : true})
        .sort({[sort]: sortDirect})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec((err, posts) =>{
            Post.countDocuments(req.query.category ? {category : req.query.category} : {})
                .find({verified : true})
                .exec((err, count) =>{
                if (err) return next(err)
                res.render("index", {
                    posts,
                    current: page,
                    pages: Math.ceil(count.length / perPage),
                    user: req.user,
                    search,
                    sortBy,
                    direc,
                    originalUrl,
                    searchTitle,
                    path,
                    messages: [req.flash("noMatch"), req.flash("errorMessage"), req.flash("deleted"), req.flash("userSignedUp"), req.flash("profileFailed"), req.flash("loggedOut"), req.flash("loggedInUser"), req.flash("notAdmin")]
                })
            })
        })
});

// user posts
router.get("/users/:page", (req, res, next) =>{
    let path = req.route.path;
    const perPage = 12;
    const page = Number(req.params.page) || 1;
    let originalUrl = req.originalUrl;
    let search = `&user=${req.query.user}`;
    let sort = req.query.order || "views"
    let sortBy = `?order=${sort}`;
    let sortDirect = parseInt(req.query.direction) || -1
    let direc = `&direction=${sortDirect}`;
    let searchTitle;
    if (sort === "views") {
        searchTitle = "Most Viewed"
    } else if (sort === "rating") {
        searchTitle = "Top Rated"
    } else if (sort === "date" && sortDirect === -1) {
        searchTitle = "Newest"
    } else if (sort === "date" && sortDirect === 1) {
        searchTitle = "Oldest"
    }
    Post
        .find({author: req.query.user})
        .find({verified : true})
        .sort({[sort]: sortDirect})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec((err, posts) =>{
            Post.countDocuments({author: req.query.user})
                .find({verified : true})
                .exec((err, count) =>{
                if (err) return next(err)
                res.render("userPosts", {
                    posts,
                    current: page,
                    pages: Math.ceil(count.length / perPage),
                    user: req.user,
                    search,
                    sortBy,
                    direc,
                    originalUrl,
                    searchTitle,
                    path,
                    messages: [req.flash("noMatch"), req.flash("errorMessage"), req.flash("deleted"), req.flash("userSignedUp"), req.flash("profileFailed"), req.flash("loggedOut"), req.flash("loggedInUser"), req.flash("notAdmin")]
                })
            })
        })
});

// create
router.post("/index", isLoggedIn, isNotFlagged, upload.single("image"),
    celebrate({
        body: Joi.object().keys({
            title: Joi.string().max(100).trim().lowercase().required(),
            body: Joi.string().max(5000).trim().required(),
            category: Joi.string().valid("Natural", "Cultural", "Events", "Man-Made").required(),
            url: Joi.string().uri().trim().required(),
            checkbox: Joi.valid("on").required()
        }),
    }),
    (req, res) =>{
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${req.body.title}.json?types=poi&proximity=-123.13060,49.28562&limit=1&country=CA&access_token=${process.env.MAPAPI}`)
        .then(response => response.json())
        .then(data => data.features[0].center)
        .then(coordinates => {
            let tempTitle = req.body.title.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace(" Of ", " of ");
            let fullPost = {
                title: filter.clean(tempTitle),
                body: filter.clean(req.body.body),
                category: req.body.category,
                url: req.body.url,
                author: req.user._id,
                image: req.file.path,
                location: coordinates
            }
            return fullPost;
        })
        .then(fullPost => Post.create(fullPost, (err, post) =>{ 
            if(err){
                req.flash("postFailed", "ُSorry. There was an error. Please try again.");
                res.redirect("/index/new")   
            } else{
                req.flash("postCreated", "Well done! Your post was succesfully created.");
                res.redirect(`/index/show/${post._id}`);
            }
        }))
        .catch(err => {
            fs.unlinkSync(req.file.path);
            req.flash("titleError", "Please make sure the title is typed correctly and try again.");
            res.redirect("/index/new")   
        });
    }
);

// show
router.get("/index/show/:id", (req, res) =>{
    let path = req.route.path;
    Post.findByIdAndUpdate(req.params.id, {$inc : {views : 1}}).populate("author").populate({path:"comments", populate: {path: "author", model: "User"}}).exec((err, post) =>{
        if(!err){
            post.views++;
            res.render("show", {
                post, 
                user: req.user,
                WEATHERAPI: process.env.WEATHERAPI, 
                MAP: process.env.MAPAPI,
                path,
                messages: [req.flash("postCreated"), req.flash("updated"), req.flash("deleteError"), req.flash("notYourPost"), req.flash("editError"), req.flash("commentError")]  
            });
        } else{
            req.flash("errorMessage", "Sorry. There was an error. Please try again");
            res.redirect("/index/1?order=views&direction=-1");
        }
    })
});

// verify posts
router.get("/verifyPost", isLoggedIn, isAdmin, (req, res) =>{
    let postId = req.query.id;
    Post.findByIdAndUpdate(postId, {verified: true}, (err, post) =>{})
});

// verify comments
router.get("/verifyComment", isLoggedIn, isAdmin, (req, res) =>{
    let commentId = req.query.id;
    Comment.findByIdAndUpdate(commentId, {verified: true}, (err, comment) =>{})
});

// delete comments
router.get("/deleteComment", isLoggedIn, isAdmin, (req, res) =>{
    let commentId = req.query.id;
    Comment.findByIdAndRemove(commentId, (err, comment) =>{
        Post.findByIdAndUpdate(comment.postId, { $pull: {comments : commentId } }, (err, updated) =>{})
    });
});

router.get("/updateRating", isLoggedIn, (req, res) =>{
    let change = req.query.change;
    let postId = req.query.id;
    Post.findByIdAndUpdate(postId, {$inc : {rating : change}}).exec((err, post) =>{
        if (!post.usersLiking.includes(req.user._id)) {
            Post.findByIdAndUpdate(postId, { $push: { usersLiking: req.user._id } }, (err, updated) =>{})
        } else{
            Post.findByIdAndUpdate(postId, { $pull: { usersLiking: req.user._id } }, (err, updated) =>{})
        }
    })
});

//navbar search
router.post("/index/1",
    celebrate({
        body: Joi.object().keys({
            search: Joi.string().max(100).trim().uppercase().required(),
        }),
    }),
    (req, res) =>{
        Post.findOne({title: new RegExp(req.body.search, "i")}).exec((err, post) =>{
            if(!post || err){
                req.flash("noMatch", "Sorry. There was no result that matched your search query.");
                res.redirect("/index/1?order=views&direction=-1");
            } else{
                res.redirect(`/index/show/${post._id}`);
            }
        })
    }
);

router.get("/title-search/:id", (req, res) =>{
    Post.find({}).sort({views: -1}).exec((err, posts) =>{
        if(!posts || err){
            console.log("error");
        } else{
            const results = posts.filter(post => post.title.toLowerCase().includes(req.params.id.toLowerCase()))
                .reduce((acc, current) => {
                    return acc.concat(
                        current.title
                    );
                }, []);; 
            // console.log(results);
            res.json(results)
        }
    })
});

// edit
router.get("/index/show/:id/edit", isLoggedIn, loggedInUser, (req, res) =>{
    let path = req.route.path;
    Post.findById(req.params.id).populate("author").exec((err, post) =>{
        res.render("edit", {
            user: req.user, 
            post,
            path
        })
    })
});

// update
router.put("/index/show/:id", isLoggedIn, loggedInUser, upload.single("image"),
    celebrate({
        body: Joi.object().keys({
            title: Joi.string().max(100).trim().required(),
            body: Joi.string().max(5000).trim().required(),
            category: Joi.string().valid("Natural", "Cultural", "Events", "Man-Made").required(),
            url: Joi.string().uri().trim().required(),
            location1: Joi.number(),
            location2: Joi.number(),
            checkbox: Joi.valid("on").required(),
            imageAttribute: Joi.string().trim().allow(""),
            ticketReserve: Joi.string().trim().allow("")
        }),
    }),
    (req, res) =>{
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${req.body.title}.json?types=poi&proximity=-123.13060,49.28562&limit=1&country=CA&access_token=${process.env.MAPAPI}`)
        .then(response => response.json())
        .then(data => data.features[0].center)
        .then(coordinates => {
            let tempTitle;
            req.user.username !== "Admin" ? tempTitle = req.body.title.replace(/(\B)[^ ]*/g, match => (match.toLowerCase())).replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace(" Of ", " of ") : tempTitle = req.body.title;
            let tempCoordinates = req.body.location1 ? [req.body.location1, req.body.location2]: coordinates;
            let editedPost = {
                title: filter.clean(tempTitle),
                body: filter.clean(req.body.body),
                category: req.body.category,
                url: req.body.url,
                location: tempCoordinates,
                verified: false
            }
            req.body.imageAttribute ? editedPost.imageAttribute = req.body.imageAttribute : editedPost.imageAttribute = "";
            req.body.ticketReserve ? editedPost.ticketReserve = req.body.ticketReserve : editedPost.ticketReserve = "";
            return editedPost;
        })
        .then(editedPost => Post.findByIdAndUpdate(req.params.id, editedPost, (err, modified) =>{
            if(req.file !== undefined){
                fs.unlinkSync(modified.image);
                Post.findByIdAndUpdate(req.params.id, {image: req.file.path}, (err, modifiedImage) =>{
                    req.flash("updated", "Well done! Your post was successfully updated.");
                    res.redirect(`/index/show/${req.params.id}`)
                })   
            }else{
                req.flash("updated", "Well done! Your post was successfully updated.");
                res.redirect(`/index/show/${req.params.id}`);
            }
        }))
        .catch(err => {
            if(req.file !== undefined){
                fs.unlinkSync(req.file.path);
            }
            req.flash("editError", "Sorry. There was an error. Please try again");
            res.redirect(`/index/show/${req.params.id}`)   
        });
    }
);

//comment
router.post("/index/show/:id", isLoggedIn, isNotFlagged,
    celebrate({
        body: Joi.object().keys({
            text: Joi.string().max(1000).trim().required(),
        }),
    }),
    (req, res) =>{
        let newComment = {
            text: filter.clean(req.body.text),
            author: req.user._id,
            postId: req.params.id
        }
        Comment.create(
            newComment, (err, createdComment) =>{
                if(!err){
                    Post.findByIdAndUpdate(req.params.id, {$push: {comments: createdComment._id}}, (err, updated) =>{
                        res.redirect(`/index/show/${req.params.id}`);
                    })
                } else{
                    req.flash("commentError", "There was an error. Please try again.");
                    res.redirect(`/index/show/${req.params.id}`);
                }
            }
        )
    }
);

// delete
router.get("/index/show/:id/delete", isLoggedIn, loggedInUser, (req, res) =>{
    let path = req.route.path;
    Post.findById(req.params.id).populate("author").exec((err, post) =>{
        res.render("delete", {
            user: req.user,
            post,
            path
        })
    })
});

router.delete("/index/show/:id", isLoggedIn, loggedInUser, (req, res) =>{
    Post.findByIdAndRemove(req.params.id, (err, post) =>{
        if(err){
            req.flash("deleteError", "Sorry. There was an error deleting the post");
            res.redirect(`/index/show/${req.params.id}`);
        } else{
            fs.unlinkSync(post.image);
            post.comments.forEach(commentId => {
                Comment.findByIdAndRemove(commentId, (err, comment) =>{});
            });
            req.flash("deleted", "Your post was successfully deleted.");
            res.redirect("/index/1?order=views&direction=-1");
        }
    });
});

//signup
router.get("/signup", isNotLoggedIn, (req, res) =>{
    let path = req.route.path;
    res.render("signup", {
        user: req.user,
        path,
        messages: [req.flash("passwordMatch"), req.flash("signUpUserError"), req.flash("signUpEmailError")]
    });
});

router.post("/signup", isNotLoggedIn,
    celebrate({
        body: Joi.object().keys({
            username: Joi.string().min(3).max(30).trim().required(),
            email: Joi.string().email().lowercase().trim().required(),
            password: Joi.string().min(8).max(256).trim().required(),
            password2: Joi.string().min(8).max(256).trim().required(),
            checkbox: Joi.valid("on").required()
        }),
    }),
    (req, res) =>{
        if(req.body.password !== req.body.password2) {
            req.flash("passwordMatch", "Please make sure you enter the same password twice.");
            res.redirect("/signup");
        } else {
        User.register(new User({ username : req.body.username }), req.body.password, (err, newUser) =>{
            if (err) {
                req.flash("signUpUserError", "Sorry. That username already exists. Please try another username.");
                res.redirect("/signup");
            } else {
                User.findOne({ username:req.body.username }, (err, foundUser) =>{
                    if (err) {
                        req.flash("signUpEmailError", "Sorry. There was an error signing you up. Please try again.");
                        res.redirect("/signup");
                    } else {
                        foundUser.email = req.body.email;
                        foundUser.save();
                    }
                })
                    passport.authenticate("local")(req, res, () =>{
                        req.flash("userSignedUp", "Congratulations! Your account was created successfully.");
                        res.redirect("/index/1?order=views&direction=-1");
                    })
            };
        })};
    }
);

//login
router.get("/login", isNotLoggedIn, (req, res) =>{
    let path = req.route.path;
    res.render("login", {
        user: req.user,
        path,
        messages: [req.flash("failedLogIn"), req.flash("PleaseLogIn")]
    });
});

router.post("/login", isNotLoggedIn,
    celebrate({
        body: Joi.object().keys({
            username: Joi.string().min(3).max(30).trim().required(),
            password: Joi.string().min(8).max(256).trim().required(),
        }),
    }),
    passport.authenticate("local", {failureRedirect: "/loginfailed"}),
    (req, res) =>{
        res.redirect("/index/1?order=views&direction=-1");
});

router.get("/loginfailed", isNotLoggedIn, (req, res) =>{
    req.flash("failedLogIn", "Login failed! The username or password is incorrect.");
    res.redirect("/login");
});

//profile
router.get("/profile", isLoggedIn, (req, res) =>{
    let path = req.route.path;
    Post.find({author: req.user._id}).populate("author").exec((err, posts) =>{
        if(!err && req.user){
            res.render("profile", {
                user:req.user, 
                posts,
                path,
                messages: [req.flash("passwordChange")] 
            });
        }
        else{
            req.flash("profileFailed", "There was an error loading the profile page. Please try again.");
            res.redirect("index/1?order=views&direction=-1")
        }
    })
});        

router.get("/profile/edit", isLoggedIn, (req, res) =>{
    let path = req.route.path;
    res.render("profileEdit", {
        user: req.user,
        path,
        messages: [req.flash("passwordMatch"), req.flash("passwordChangeError")]
    });
});

router.post("/profile", isLoggedIn, 
    celebrate({
        body: Joi.object().keys({
            password: Joi.string().min(8).max(256).trim().required(),
            password2: Joi.string().min(8).max(256).trim().required(),
        }),
    }),
    (req, res) =>{
        if(req.body.password !== req.body.password2) {
            req.flash("passwordMatch", "Please make sure you enter the same password twice.");
            res.redirect("/profile/edit");
        } else {
            User.findOne({username: req.user.username}).then(user =>{
                if (user){
                    user.setPassword(req.body.password, err =>{
                        user.save();
                        req.flash("passwordChange", "You have successfully changed your password.");
                        res.redirect("/profile");
                    });
                } else {
                    req.flash("passwordChangeError", "There was an error. Please try again");
                    res.redirect("/profile/edit");
                }
            })
            .catch(err =>{
                req.flash("passwordChangeError", "There was an error. Please try again");
                res.redirect("/profile/edit");
            })
        }
    }
);

router.get("/profile/verify", isLoggedIn, isAdmin, (req, res) =>{
    let path = req.route.path;
    Post.find({verified: false}).populate("author").exec((err, posts) =>{
        if(!err && req.user && req.user.username === "Admin"){
            res.render("validatePosts", {
                user:req.user, 
                posts,
                path
            });
        }
        else{
            res.redirect("/profile")
        }
    })
});  

router.get("/profile/comments", isLoggedIn, isAdmin, (req, res) =>{
    let path = req.route.path;
    Comment.find({verified: false}).populate("author").exec((err, comments) =>{
        if(!err && req.user && req.user.username === "Admin"){
            res.render("validateComments", {
                user:req.user, 
                comments,
                path
            });
        }
        else{
            res.redirect("/profile")
        }
    })
});

router.get("/profile/users", isLoggedIn, isAdmin, (req, res) =>{
    let path = req.route.path;
    User.find({}).populate("author").exec((err, users) =>{
        if(!err && req.user && req.user.username === "Admin"){
            res.render("allUsers", {
                user:req.user, 
                users,
                path
            });
        }
        else{
            res.redirect("/profile")
        }
    })
});  

router.get("/profile/flagusers", isLoggedIn, isAdmin, (req, res) =>{
    let change = req.query.change;
    let userId = req.query.id;
    User.findByIdAndUpdate(userId, {flagged : change}).exec((err, user) =>{})
});

// logout
router.get("/logout", isLoggedIn, (req, res) =>{
    req.logout();
    req.flash("loggedOut", "You have succesfully logged out!");
    res.redirect("/index/1?order=views&direction=-1");
});

router.get("/about", (req, res) =>{
    let path = req.route.path;
    res.render("about", {
        user: req.user,
        path
    });
})

router.get("/privacy", (req, res) =>{
    let path = req.route.path;
    res.render("privacy", {
        user: req.user,
        path
    });
})

router.get("/terms", (req, res) =>{
    let path = req.route.path;
    res.render("terms", {
        user: req.user,
        path
    });
})

router.get("/contact", (req, res) =>{
    let path = req.route.path;
    res.render("contact", {
        user: req.user,
        path
    });
})

router.post("/contact",
    celebrate({
        body: Joi.object().keys({
            name: Joi.string().max(1024).trim().required(),
            email: Joi.string().max(256).email().lowercase().trim().required(),
            message: Joi.string().max(5096).trim().required()
        }),
    }),
    (req, res) =>{
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            },
        });
        let info = {
            from: req.body.email,
            to: process.env.EMAILTO,
            subject: `Vancouver Guide Message | name: ${req.body.name} | email: ${req.body.email}`,
            text: req.body.message
        };
        transporter.sendMail(info, (err, sent)=>{})
    }
);

// 404
router.get("*", (req, res) =>{
    res.render("404")
});

module.exports = router;