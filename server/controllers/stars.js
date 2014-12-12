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
    var userid = req.user.github;
    var token = req.user.tokens[0].accessToken;

    Repo.find({
      id: req.user.github
    }, function(err, data) {
      if (err) {
        res.json(err);
      }
      else {
        data = data[0];
        var thisd = new Date();
        thisd = thisd.getTime();
        if (data.lastSynced > thisd + 43200000 || !data.lastSynced || req.query
          .force) {
          var page = 1;
          var funcArray = [];
          var totalResults = [];

          function createRequestFunction(pageIndex) { 
            return function(callback) {
              var options = {
                hostname: 'https://api.github.com',
                path: '/user/' + userid + '/starred?access_token=' +
                  token + '&per_page=100&page=' + pageIndex,
                headers: {
                  'User-Agent': 'Constella',
                  'Accept': 'application/json'
                }
              };
              unirest.get(options.hostname + options.path)
                .headers(options.headers)
                .end(function(response) {
                  totalResults = _.union(totalResults, response.body);
                  callback(false, data)
                });
            }
          }
          for (var i = 1; i <= 10; i++) { 
            funcArray.push(createRequestFunction(i))
          }
          async.parallel(funcArray, function(err, results) {
            if (err) {
              res.json({
                'error': results
              })
            }
            var allStars = [];
            for (var i = results.length - 1; i >= 0; i--) {
              if (results[i][0]) {
                if (results[i][0].length === 0) {
                  results.splice(i, 1);
                }
                else {
                  var allStars = results[i].concat(allStars);
                }
              }
            }
            data.repos.remote = allStars;
            var d = new Date()
            data.lastSynced = d.getTime();
            data.save(function(err) {
              if (err) return res.json({
                'error': err
              });
              res.json('sync success');
            });
          });
        }
        else {
          res.json('already synced');
        }
      }
    });
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