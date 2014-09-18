var fs = require('fs');
var path = require('path');
var routes = fs.readdirSync('./server/routes/').filter(_filterroutes);
var _ = require('lodash');

function _filterroutes(name) {
  var notIndex = (path.extname(name).indexOf('index') < 0);
  return notIndex;
};

module.exports = {
  init: function(server) {
    _.forEach(routes, function(route) {
      if (route !== 'index.js') {
        var thisRoute = require('./' + route);
        thisRoute(server);
      }
    });
  }
}