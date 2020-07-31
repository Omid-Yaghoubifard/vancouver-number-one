const mongoose = require("mongoose");

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
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    date: { type: Date, default: Date.now },
    url: String,
    location: Array,
    fields: {type: [String], text: true}
});

module.exports = mongoose.model("Post", Post);