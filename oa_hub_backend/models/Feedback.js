const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    // Star Rating (1-5)
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    // User feedback content
    pros: {
        type: String,
        default: "",
        maxlength: [2000, 'Pros cannot be more than 2000 characters']
    },
    cons: {
        type: String,
        default: "",
        maxlength: [2000, 'Cons cannot be more than 2000 characters']
    },
    suggestions: {
        type: String,
        default: "",
        maxlength: [2000, 'Suggestions cannot be more than 2000 characters']
    },
    // Metadata
    userAgent: {
        type: String,
        default: ""
    },
    ipAddress: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
