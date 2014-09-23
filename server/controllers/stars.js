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
      },
      function(err, data) {
        if (err) {
          res.json(err);
        }
        else {
          data = data[0];
          var thisd = new Date();
          thisd = thisd.getTime();
          if (data.lastSynced > thisd + 43200000 || !data.lastSynced || req.query
            .force) {
            var allStars = [];


            function everyThousand(offset) {
              var funcArray = [];
              var tempAll = [];

              function createRequestFunction(pageIndex) { 
                return function(callback) {
                  var url = 'https://api.github.com/user/' + userid +
                    '/starred?access_token=' +
                    token + '&per_page=100&page=' + pageIndex;
                  var headers = {
                    'User-Agent': 'Constella',
                    'Accept': 'application/json'
                  };
                  unirest.get(url)
                    .headers(headers)
                    .end(function(response) {
                      if (!response.error) {
                        tempAll = _.union(response.body, tempAll);
                        callback(false, response.body);
                      }
                      else {
                        console.log('error', response.body);
                        callback(true, response.body);
                      }
                    })
                }
              }
              for (var i = (1 + offset); i <= (10 + offset); i++) { 
                console.log(i);
                funcArray.push(createRequestFunction(i))
              }
              async.parallel(funcArray, function(err, results) {
                for (var i = tempAll.length - 1; i >= 0; i--) {
                  if (tempAll[i].length === 0) {
                    tempAll.splice(i, 1);
                  }
                  else {
                    allStars.unshift(tempAll[i]);
                  }
                }
                if (tempAll.length >= 1000) {
                  offset += 10;
                  everyThousand(offset);
                }
                else {
                  afterCalls();
                }
              });
            }
            everyThousand(0);

            function afterCalls() {
              data.repos.remote = allStars;
              data.lastSynced = moment().format('X');
              data.save(function(err) {
                if (err) return res.json({
                  'error': err
                });
                res.json('success');
              });
            }
          }
          else {
            res.json('already synced');
          }
        }
      }
    );
  },
  getStar: function(req, res, next) {
    var userid = req.user.github;
    var token = req.user.tokens[0].accessToken;
    var repoId = parseInt(req.params.id);
    Repo.find({
        id: req.user.github
      },
      function(err, data) {
        if (err) {
          res.json(err);
        }
        else {
          data = data[0];
          if (data.repos.remote.length > 0) {
            var remote = _.where(data.repos.remote, {
              id: repoId
            });
            var local = _.where(data.repos.local, {
              id: repoId
            });
            if (remote[0]) {
              var _finalData = {
                remote: remote[0],
                local: local[0]
              }
              res.json(_finalData);
            }
          }
        }
      }
    );
  },
  updateStar: function(req, res, next) {
    console.log('updating');
    var name = req.body.name;
    var description = req.body.description;
    var language = req.body.language;
    var tags = req.body.tags;
    var userid = req.user.github;
    var token = req.user.tokens[0].accessToken;
    var repoId = parseInt(req.params.id);
    Repo.find({
        id: req.user.github
      },
      function(err, data) {
        if (err) {
          res.json(err);
        }
        else {
          console.log('got data')
          data = data[0];
          if (data.repos.remote.length > 0) {
            console.log('remote exists')
            var allRemote = _.cloneDeep(data.repos.remote);
            var allLocal = _.cloneDeep(data.repos.local);
            var remote = _.where(allRemote, {
              id: repoId
            });
            var local = _.where(allLocal, {
              id: repoId
            });
            if (remote[0]) {
              console.log('remote[0] exists')
              var data2save = {
                id: repoId
              }
              data2save.name = name ? name : null
              data2save.description = description ? description : null
              data2save.language = language ? language : null
              data2save.tags = tags ? tags : null
              allLocal = _.omit(allLocal, {
                id: repoId
              });
              console.log(allLocal)
              if (allLocal.length > 0) {
                allLocal.push(data2save);
              }
              else {
                allLocal = [
                  data2save
                ];
              }
              data.repos.local = _.cloneDeep(allLocal);
              console.log('to save')
              data.save(function(err) {
                console.log('save')
                if (err) {
                  return res.json({
                    'error': err
                  });
                }
                else {
                  var _finalData = {
                    remote: remote[0],
                    local: data2save
                  }
                  res.json(_finalData);
                }
              });
            }
          }
        }
      }
    );

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