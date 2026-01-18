const mongoose = require('mongoose');

const CompanyImageSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        lowercase: true,  // Auto-lowercase on save
        trim: true,
        index: true
    },
    companySlug: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,  // One document per company
        index: true
    },
    imageUrls: {
        type: [String],  // Array of image URLs
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CompanyImage', CompanyImageSchema);
