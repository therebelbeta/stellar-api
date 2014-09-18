var _ = require('lodash');
// API docs: http://lodash.com/docs
var moment = require('moment');
// API docs: http://momentjs.com/docs/
var jwt = require('jwt-simple');
var secrets = require('../config/secrets');
var User = require('../model/User');
module.exports = {
  createToken: function(req, user) {
    var payload = {
      user: user,
      ua: req.headers['user-agent'],
      location: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      expiration: moment().add(12, 'hours').format('X')
    };
    var token = jwt.encode(payload, secrets.jwt);
    return token;
  },
  checkToken: function(req, res, next) {
    var ua = req.headers['user-agent'];
    var location = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var now = moment().format('X');
    var token = req.headers['authorization'].split('Bearer ')[1];
    var decoded = jwt.decode(token, secrets.jwt);
    if (
      decoded.location !== location ||
      decoded.ua !== ua
    ) {
      _internal.fail(res);
    }
    else if (parseInt(decoded.expiration) < parseInt(now)) {
      _internal.fail(res, {
        error: 'Session has expired. Please login again.'
      });
    }
    else {

      User.findOne({
        github: decoded.user
      }, function(err, results) {
        if (err) {
          _internal.fail(res);
        }
        else if (results.sessionToken !== token) {
          _internal.fail(res, {
            error: 'User logged in elsewhere. Please login again.'
          })
        }
        else {
          req.user = results;
          next();
        }
      })
    }
  }
}
// If this gets too big, split out into a separate helper file
var _internal = {
  fail: function(res, msg) {
    res.send(401, msg);
  }
}