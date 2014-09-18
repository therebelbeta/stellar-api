var routes = require('../config/routes');
var passportHelper = require('../helpers/passport');
var passportCtrl = require('../controllers/passport')

module.exports = function(server) {
  server.get(
    routes.github.login,
    passportHelper.gh_handler
  );
  server.get(
    routes.github.callback,
    passportHelper.gh_handler,
    passportCtrl.gh_callback
  );
}