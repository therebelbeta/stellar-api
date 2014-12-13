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
var secrets = require('../config/secrets');

module.exports = {
  getAllStars: function(req, res, next) {
    var page = parseInt(req.query.page) || 0;
    var count = parseInt(req.query.count) || 50;
    var sort = req.query.sort || null;
    var filtertype = req.query.type || null;
    var filterquery = req.query.q || null;

    Repo.find({
      id: req.user.github
    }, function(err, data) {
      if (err) {
        res.json(err);
      }
      else {
        data = data[0];
        var reposRemote = _.cloneDeep(data.repos.remote);
        var reposLocal = _.cloneDeep(data.repos.local);

        //combine with local data here
        reposRemote = _.map(reposRemote, function(obj) {
          var thisLocalData = _.where(reposLocal, {
            id: obj.id
          });
          console.log(obj.id, reposLocal.length, thisLocalData.length)
          if (thisLocalData.length > 0) {
            thisLocalData = thisLocalData[0];
            obj.local_name = thisLocalData.name;
            obj.local_language = thisLocalData.language;
            obj.local_tags = thisLocalData.tags;
            obj.local_notes = thisLocalData.notes;
          }
          return obj;
        })
        console.log(reposLocal)

        //run search query here

        //pagination
        var finalRepos;
        var lastPage = Math.floor(reposRemote.length / count) + 1;
        var startIndex = (page - 1) * count;
        var endIndex = startIndex + count;
        if (lastPage === page) {
          endIndex = reposRemote.length - 1;
        }

        var pagination = {
          page: page,
          count: count,
          index: [startIndex, endIndex],
          total_pages: lastPage,
          total_count: reposRemote.length
        };
        if (reposRemote.length > count) {
          finalRepos = reposRemote.slice(startIndex, endIndex);
          if (finalRepos.length === count) {
            pagination.next = secrets.protocol +
              '://' + secrets.hostname +
              ':' + secrets.port +
              '/api/star?page=' + (page + 1) +
              '&count=' + count +
              '&sort=' + sort +
              '&type=' + filtertype +
              '&q=' + filterquery;
            pagination.last = secrets.protocol +
              '://' + secrets.hostname +
              ':' + secrets.port +
              '/api/star?page=' + (lastPage) +
              '&count=' + count +
              '&sort=' + sort +
              '&type=' + filtertype +
              '&q=' + filterquery

          }
        }
        else {
          finalRepos = _.cloneDeep(reposRemote);
        }

        //craft response
        var response = {
          lastSynced: data.lastSynced,
          pagination: pagination,
          tags: data.tags,
          repos: finalRepos
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
    var id = req.params.id || false;

    Repo.find({
      id: req.user.github
    }, function(err, data) {
      if (err) {
        res.json(err);
      }
      else {
        data = data[0];
        var reposRemote = _.cloneDeep(data.repos.remote);
        var thisRepo = _.where(reposRemote, {
          id: id
        })[0];
        // get readme



        //craft response
        var response = thisRepo;
        res.json(response);
      }
    });
  },
  updateStar: function(req, res, next) {
    var id = parseInt(req.params.id);
    var name = req.body.name;
    var language = req.body.language;
    var tags = req.body.tags;
    if (tags && tags.indexOf(',') > -1) {
      tags = tags.split(',');
    }
    else if (tags) {
      tags = [tags];
    }
    var notes = req.body.notes;

    Repo.find({
      id: req.user.github
    }, function(err, data) {
      if (err) {
        res.json(err);
      }
      else {
        data = data[0];
        var reposLocal = _.cloneDeep(data.repos.local);
        var thisRepo = _.where(reposLocal, {
          id: id
        });
        if (thisRepo.length === 0) {
          thisRepo = {
            id: id,
            name: name,
            language: language,
            tags: tags,
            notes: notes
          };
          data.repos.local.push(thisRepo);
        }
        else {
          thisRepo = {
            id: id,
            name: name,
            language: language,
            tags: tags,
            notes: notes
          };
          reposLocal = _.reject(reposLocal, {
            id: id
          });
          reposLocal.push(thisRepo);
          data.repos.local = _.cloneDeep(reposLocal);
        }
        _.forEach(tags, function(thisTag, index) {
          var findTag = _.where(data.tags, thisTag);
          var tagExists = findTag.length > 0;
          if (!tagExists) {
            data.tags.push(thisTag);
          }
        });
        data.save(function(err) {
          if (err) return res.json({
            'error': err
          });
          res.json({
            update: 'complete'
          });
        });
      }
    });

  },
  deleteStar: function(req, res, next) {

  }
}

// If this gets too big, split out into a separate helper file
var _internal = {

}