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
    rating: {
        type: Number,
        default: 0
    },
    usersLiking: [{
        type: String
    }],
    views: {
        type: Number,
        default: 0
    },
    image: String,
    imageAttribute: String,
    ticketReserve: String,
    verified: {
        type: Boolean,
        default: false
    },  
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