require('dotenv').config();
const _ = require('lodash');
const Glue = require('glue');
const basic = require('hapi-auth-basic');

const auth = require('./../index');

const TEST_PORT = process.env.TEST_PORT || 9090;

const manifestOptions = {
  connections: [{
    port: TEST_PORT,
    host: '0.0.0.0'
  }]
};

let finalServer;

/**
 * Helper method to inject to server without exposing the server itself
 * @param {String}  method    HTTP method
 * @param {String}  path      Endpoint to inject to
 * @param {String}  token     User's token
 * @param {Object}  [headers] Headers
 */
async function serverInject(method, path, token, headers) {
  const request = {
    method,
    url: path,
    headers: {}
  };

  if (!_.isNil(headers)) {
    request.headers = headers;
  }

  if (!_.isNil(token)) {
    request.headers.authorization = token;
  }

  try {
    return await finalServer.inject(request);
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Starts the mock server
 */
function start() {
  if (_.isNil(finalServer)) {
    return Glue.compose(manifestOptions, {})
      .then((server) => {
        finalServer = server;

        finalServer.register({ register: auth, options: {}});
        finalServer.register({ register: basic, options: {}});

        finalServer.auth.strategy('keycloak-jwt-public', 'keycloak-jwt', {
          issuer: process.env.KEYCLOAK_ISS,
          baseUrl: process.env.KEYCLOAK_BASE_URL,
          realm: process.env.KEYCLOAK_REALM,
          introspect: false
        });

        finalServer.auth.strategy('keycloak-jwt-introspect', 'keycloak-jwt', {
          issuer: process.env.KEYCLOAK_ISS,
          baseUrl: process.env.KEYCLOAK_BASE_URL,
          realm: process.env.KEYCLOAK_REALM,
          introspect: true,
          clientId: process.env.KEYCLOAK_CLIENT_ID,
          clientSecret: process.env.KEYCLOAK_CLIENT_SECRET
        });

        finalServer.auth.strategy('basic', 'basic', { 
          validateFunc: (r, u, p, c) => { return c(null, true, {})}
        });

        finalServer.route({
          method: 'GET',
          path: '/public',
          config: {
            auth: {
              strategies: ['keycloak-jwt-public']
            }
          },
          handler: (request, reply) => reply(request.auth.credentials)
        });

        finalServer.route({
          method: 'GET',
          path: '/introspect',
          config: {
            auth: {
              strategies: ['keycloak-jwt-introspect']
            }
          },
          handler: (request, reply) => reply(request.auth.credentials)
        });

        finalServer.route({
          method: 'GET',
          path: '/multiple',
          config: {
            auth: {
              strategies: ['keycloak-jwt-introspect', 'basic']
            }
          },
          handler: (request, reply) => reply(request.auth.credentials)
        });

        return finalServer.start();
      })
      .then(() => Promise.resolve(finalServer));
  }

  return Promise.resolve(finalServer);
}

module.exports = {
  start,
  serverInject
};
