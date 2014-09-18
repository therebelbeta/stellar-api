var routes = require('../config/routes');
var session = require('../helpers/session');
var tagsCtrl = require('../controllers/tags');

module.exports = function(server) {

  server.get(
    '/api/tags',
    session.checkToken,
    tagsCtrl.getAllTags);
  server.get(
    '/api/tag/:id?',
    session.checkToken,
    tagsCtrl.getTag);
  server.post(
    '/api/tag/:id?',
    session.checkToken,
    tagsCtrl.saveTag);
  server.del(
    '/api/tag/:id',
    session.checkToken,
    tagsCtrl.deleteTag);
}