var passport = require('passport');
var crypto = require('crypto');
var githubStrategy = require('passport-github').Strategy;

var routes = require('../config/routes');
var secrets = require('../config/secrets');

var session = require('../helpers/session');

var User = require('../model/User');
var Repo = require('../model/Repo');


// Sessions aren't used in this example.  To enabled sessions, enable the
// `session` option and implement session support with user serialization.
// See here for info: http://passportjs.org/guide/configuration.html

module.exports = {
  gh_passport: function() {
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      User.findById(id, function(err, user) {
        done(err, user);
      });
    });
    passport.use(
      new githubStrategy({
          clientID: secrets.github.app_id,
          clientSecret: secrets.github.app_secret,
          callbackURL: secrets.protocol + "://" + secrets.hostname + ":" +
            secrets.port + routes.github.callback,
          passReqToCallback: true
        },
        function(req, accessToken, refreshToken, profile, done) {
          User.findOne({
            github: profile.id
          }, function(err, existingUser) {
            if (err) return done(true, err);
            console.info('no req.user', existingUser)
            if (existingUser) {
              console.log('existing')
              // update user with new session token
              var sessionToken = session.createToken(req, profile.id)
              existingUser.sessionToken = sessionToken;
              existingUser.save(function(err) {
                if (err) return done(true, err);
                req.user = existingUser;
                return done(null, existingUser)
              });
            }
            else {
              var user = new User();
              user.email = profile._json.email;
              user.github = profile.id;
              user.tokens.push({
                kind: 'github',
                accessToken: accessToken
              });
              var sessionToken = session.createToken(req, profile.id)
              user.sessionToken = sessionToken;
              user.profile.tags = [];
              user.profile.name = profile.displayName;
              user.profile.picture = profile._json.avatar_url;
              user.profile.location = profile._json.location;
              user.profile.website = profile._json.blog;
              user.profile.gravatar = _toGravatar(profile._json.email)
              user.profile.useGravatar = false;
              user.profile.emailUpdates = true;
              user.save(function(err) {
                // console.log('error', err)
                var repo = new Repo();
                repo.id = profile.id;
                repo.repos = {};
                repo.repos.local = [];
                repo.repos.remote = [];
                repo.save(function(err) {
                  if (err) return done(true, err);
                  req.user = user;
                  req.user.sessionToken = sessionToken;
                  done(err, user);
                });
              });
            }
          });
        }
      )
    );
  },
  gh_handler: passport.authenticate('github', {
    session: false,
    scope: 'user,repo'
  }),
  gh_callback_handler: passport.authenticate('github', {
    session: false,
    scope: 'user,repo'
  })
}

function _toGravatar(email) {
  var size = 200;
  var defaults = 'retro';

  if (!email) {
    return 'https://gravatar.com/avatar/?s=' + size + '&d=' + defaults;
  }
  var md5 = crypto.createHash('md5').update(email.toLowerCase());
  return 'https://gravatar.com/avatar/' + md5.digest('hex').toString() +
    '?s=' +
    size + '&d=' + defaults;
}