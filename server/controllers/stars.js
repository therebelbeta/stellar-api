var _ = require('lodash');
// API docs: http://lodash.com/docs
var async = require("async");
// API docs: https://github.com/caolan/async
var moment = require('moment');
// API docs: http://momentjs.com/docs/
var numeral = require('numeral');
// API docs: http://numeraljs.com/
var unirest = require("unirest");
// API docs: http://unirest.io/nodejs.html

var Repo = require('../model/Repo');

module.exports = {
  getAllStars: function(req, res, next) {
    Repo.find({
      id: req.user.github
    }, function(err, data) {
      if (err) {
        res.json(err);
      }
      else {
        data = data[0];
        console.log(' ');
        var response = {
          repos: data.repos,
          lastSynced: data.lastSynced,
          tags: data.tags
        }
        res.json(response);
      }
    });
  },
  syncStars: function(req, res, next) {

  },
  getStar: function(req, res, next) {

  },
  updateStar: function(req, res, next) {

  },
  deleteStar: function(req, res, next) {

  }
}

// If this gets too big, split out into a separate helper file
var _internal = {
  example: function() {
    // Internal module functions here.
  }
}