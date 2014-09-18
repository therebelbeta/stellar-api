var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var userSchema = new mongoose.Schema({
  github: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    lowercase: true
  },
  sessionToken: String,
  tokens: Array,
  profile: {
    name: {
      type: String,
      default: ''
    },
    gender: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    picture: {
      type: String,
      default: ''
    },
    gravatar: {
      type: String,
      default: ''
    },
    useGravatar: Boolean,
    emailUpdates: Boolean
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

module.exports = mongoose.model('User', userSchema);