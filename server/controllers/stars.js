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
    var page = parseInt(req.query.page) || 0;
    var count = parseInt(req.query.count) || 50;
    var sort = req.query.sort || false;
    var filtertype = req.query.type || false;
    var filterquery = req.query.q || false;
    console.log(page, count)
    console.log('getting data', req.user.github)
    Repo.find({
      id: req.user.github
    }, function(err, data) {
      if (err) {
        res.json(err);
      }
      else {
        console.log('got data')
        data = data[0];
        console.log(' ');
        var reposRemote = _.cloneDeep(data.repos.remote);

        //combine with local data here

        //run search query here

        //pagination
        var startIndex = page * count;
        var endIndex = startIndex + count;
        reposRemote = reposRemote.slice(startIndex, endIndex);

        //craft response
        var response = {
          repos: {
            remote: reposRemote,
            local: false
          },
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
        var thisd = moment();
        var lastd = moment(data.lastSynced, 'X');
        var difference = thisd.diff(lastd, 'minutes')
        console.log(typeof difference, difference);
        if (difference >= 5 || !data.lastSynced || req.query
          .force) {
          _recursiveCalls(data);
        }
        else {
          res.json({
            sync: 'complete'
          });
        }
      }
    });

    function _recursiveCalls(data, page, runningTotal) {
      runningTotal = runningTotal || [];
      page = page || 0;
      var funcArray = [];

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
              if (response.error) {
                callback(true, response.error)
              }
              callback(false, response.body)
            });
        }
      }
      for (var i = (1 + (page * 10)); i <= (10 + (page * 10)); i++) { 
        funcArray.push(createRequestFunction(i))
      }
      async.parallel(funcArray, function(err, results) {
        if (err) {
          res.json({
            'error': results
          })
        }
        _.forEach(results, function(hundredset, index) {
          runningTotal = _.union(runningTotal, hundredset);
        })
        if (runningTotal.length === 1000) {
          page++;
          _recursiveCalls(data, page, runningTotal)
        }
        else {
          _afterCalls(data, runningTotal)
        }
      });
    }

    function _afterCalls(data, allStars) {
      allStars = _.map(allStars, function(obj) {
        var newObj = {
          id: obj.id,
          name: obj.name,
          full_name: obj.full_name,
          owner_login: obj.owner.login,
          owner_id: obj.owner.id,
          owner_avatar_url: obj.owner.avatar_url,
          isPrivate: obj["private"],
          html_url: obj.html_url,
          description: obj.description,
          fork: obj.fork,
          created_at: obj.created_at,
          updated_at: obj.updated_at,
          ssh_url: obj.ssh_url,
          clone_url: obj.clone_url,
          homepage: obj.homepage,
          stargazers_count: obj.stargazers_count,
          watchers_count: obj.watchers_count,
          language: obj.language,
          forks: obj.forks,
          open_issues: obj.open_issues
        }
        return newObj;
      })
      data.repos.remote = allStars;
      data.lastSynced = moment().format('X');
      data.save(function(err) {
        if (err) return res.json({
          'error': err
        });
        res.json({
          sync: 'complete'
        });
      });
    }
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

}