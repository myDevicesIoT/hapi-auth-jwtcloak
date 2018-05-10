const controller = require('./lib/controller');
const pkg = require('./package.json');

/**
 * Register the authentiction scheme
 * @param {Object}    server  Hapi server we are attachhing scheme to
 * @param {Object}    options Additional options to set
 * @param {Function}  next    Callback
 */
function initialize(server, options, next) {
  server.auth.scheme('keycloak-jwt', controller);

  return next();
}

exports.register = initialize;
exports.register.attributes = { pkg };
