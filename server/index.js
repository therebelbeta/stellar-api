var restify = require('restify');
var passport = require('passport');
var server = restify.createServer();

var mongoose = require('./model/mongoose').init();

var passportHelper = require('./helpers/passport');
var routes = require('./routes');

// set up server
server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser());
server.use(restify.dateParser());
server.use(restify.queryParser());
server.use(restify.jsonp());
server.use(restify.gzipResponse());
server.use(restify.bodyParser());
server.use(passport.initialize());

// initiate routes and passport
routes.init(server);
passportHelper.gh_passport();

// Start the app by listening on <port>
var port = process.env.PORT || 3100
server.listen(port)
console.log('Constella started on port ' + port)