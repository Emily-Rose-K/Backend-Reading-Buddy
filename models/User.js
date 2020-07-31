const mongoose = require('mongoose')
const Schema = mongoose.Schema


const UserSchema = new Schema({
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
        type: String,
        required: true,
    },
    user_name: {
        type: String,
        required: true
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    readerExperiences:  [{
      type: mongoose.Schema.Types.ObjectId, 
      ref: "ReaderExperience"
    }],
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    date: {
      type: Date,
      default: Date.now
    },
  });

  module.exports = mongoose.model('User', UserSchema)
  // maybe ...exports = User = mongoose...