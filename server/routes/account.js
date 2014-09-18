var routes = require('../config/routes');
var session = require('../helpers/session');
var accountCtrl = require('../controllers/account');

module.exports = function(server) {
  server.get(
    '/api/account/logout',
    session.checkToken,
    accountCtrl.logout);
  server.get(
    '/api/account/user',
    session.checkToken,
    accountCtrl.getAccount);
  server.put(
    '/api/account/user',
    session.checkToken,
    accountCtrl.updateAccount);
  server.del(
    '/api/account/user',
    session.checkToken,
    accountCtrl.deleteAccount);
}