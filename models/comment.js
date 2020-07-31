const mongoose = require("mongoose");

const Comment = new mongoose.Schema({
    text: String,
    author: [{
           type: mongoose.Schema.Types.ObjectId,
           ref: "User"
    }],
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Comment", Comment);