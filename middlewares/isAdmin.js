function isAdmin(req, res, next){
    if(req.user && req.user.username === "Admin"){
        next();
    } else{
        req.flash("notAdmin", "You do not have permission to access that page.");
        res.redirect("/index/1?order=views&direction=-1")
    }
};

module.exports = isAdmin;