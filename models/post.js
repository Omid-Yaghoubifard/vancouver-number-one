const mongoose = require("mongoose"),
      User     = require("./user");

const Post = new mongoose.Schema({
    title: String,
    author: [{
           type: mongoose.Schema.Types.ObjectId,
           ref: "User"
    }],
    body: String,
    category: {
        type: String,
        enum: ["Natural", "Cultural", "Events", "Man-Made"]
    },
    image: String,
    comments: [{ body: String, date: { type: Date, default: Date.now } }],
    date: { type: Date, default: Date.now },
    url: String
})

module.exports = mongoose.model("Post", Post);