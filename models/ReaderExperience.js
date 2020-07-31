const mongoose = require('mongoose');
const Schema = mongoose.Schema

const ReaderExperienceSchema = new Schema({
    rating: {
        type: Number,
        minimum: 0,
        maximum: 5
    },
    review: {
        type: String
    },
    status: {
        type: String,
        validate: /^wishlist$|^started$|^finished$/,
        required: true
    },
    date_started: {
        type: Date
    },
    date_finished: {
        type: Date
    },
    book: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Book",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

module.exports = mongoose.model('ReaderExperience', ReaderExperienceSchema);