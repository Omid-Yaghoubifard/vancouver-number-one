const mongoose = require("mongoose");

const Comment = new mongoose.Schema({
    text: String,
    author: [{
           type: mongoose.Schema.Types.ObjectId,
           ref: "User"
    }],
    postId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }],
    date: { type: Date, default: Date.now },
    verified: {
        type: Boolean,
        default: false
    },
});

module.exports = mongoose.model("Comment", Comment);