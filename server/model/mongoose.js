var mongoose = require('mongoose');
var secrets = require('../config/secrets');
// * Mongoose configuration.
module.exports = {
  init: function() {
    mongoose.connect(secrets.db);
    mongoose.connection.on('error', function() {
      console.error(
        '✗ MongoDB Connection Error. Please make sure MongoDB is running.');
    });
    console.log('Connecting to MongoDB.')
    return mongoose;
  }
}