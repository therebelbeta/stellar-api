var routes = require('../config/routes');
var session = require('../helpers/session');
var starsCtrl = require('../controllers/stars');

module.exports = function(server) {
  server.get(
    '/api/star',
    session.checkToken,
    starsCtrl.getAllStars);

  server.put(
    '/api/star/sync',
    session.checkToken,
    starsCtrl.syncStars);

  // Wildcard routes
  server.get(
    '/api/star/:id',
    session.checkToken,
    starsCtrl.getStar);
  server.put(
    '/api/star/:id?',
    session.checkToken,
    starsCtrl.updateStar);
  server.del(
    '/api/star/:id?',
    session.checkToken,
    starsCtrl.deleteStar);
}