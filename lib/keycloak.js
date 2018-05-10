const _ = require('lodash');
const Boom = require('boom');
const assert = require('assert');
const JWT = require('jsonwebtoken');
const superagent = require('superagent');

const KeycloakCerts = require('./getPublicKey');

/**
 * 
 * @param {Object}  server                  Hapi server we are attachhing plugin to
 * @param {Object}  options                 Configuration options passed
 * @param {String}  options.issuer          Keycloak's issuer
 * @param {String}  options.baseUrl         Keycloak base URL
 * @param {String}  options.realm           Keycloak realm to validate against
 * @param {Boolean} [options.introspect]    If false, use keycloak's token instrospect
 * @param {String}  [options.clientId]      Required if using token introspection
 * @param {String}  [options.clientSecret]  Required if using token introspection
 */
function controller(server, options) {
  if (_.isNil(options.introspect)) {
    options.usePublicKey = false;
  }
  assert(options, 'options are required for keycloak-jwt scheme');
  assert(options.issuer, 'keycloak `issuer` is required');
  assert(options.baseUrl, 'keycloak `baseUrl` is required');
  assert(options.realm, 'keycloak `realm` is required');
  assert(
    options.introspect ? options.clientId && options.clientSecret : true,
    'keycloak `clientId` and `clientSecret` are required to perform token introspect'
  );

  /**
   * Verify the keycloak token
   * @param {String}  token Keycloak token from request
   * @param {String}  key   Keycloak public key
   */
  const verify = function verify(token, key) {
    let data;
    try {
      data = JWT.verify(token, key);
      return Promise.resolve(true);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  options.certFunc = new KeycloakCerts(options.baseUrl, options.realm);

  return {
    /**
    * Authenticator for the scheme.
    * If unauthorize, reply with Boom null message and auth scheme to try other strategies
    * @param {Object} request  Hapi route handler
    * @param {Object} reply    Hapi reply interface
    */
    authenticate: function(request, reply) {
      let token = request.headers.authorization;
      token = token ? token.replace(/Bearer/gi, '').replace(/ /g, '') : null;
      if (_.isNil(token)) {
        token = token ? token.replace(/bearer/gi, '').replace(/ /g, '') : null;
      }
      let decoded;
      try {
        decoded = JWT.decode(token, { complete: true });
      } catch (e) {
        return reply(Boom.unauthorized(null, 'keycloak-jwt'));
      }

      if (options.introspect) {
        const basicToken = Buffer.from(`${options.clientId}:${options.clientSecret}`).toString('base64');
        const url = `${options.issuer}/protocol/openid-connect/token/introspect`;
        const headers = {
          Authorization: `Basic ${basicToken}`,
          connection: 'keep-alive',
          'content-type': 'application/x-www-form-urlencoded'
        };
        const body = { token: token }
        return superagent('POST', url)
          .set(headers)
          .send(body)
          .then((response) => {
            const { body } = response;
            if (!body.active) {
              return reply(Boom.unauthorized(null, 'keycloak-jwt'));
            }
            return reply.continue({
              credentials: decoded.payload,
              artifacts: token
            });
          })
          .catch(err => reply(Boom.unauthorized(null, 'keycloak-jwt')));
      }
    
      let promise = Promise.resolve([]);
      if (_.isNil(options.publicKey)) {
        const kid = decoded.header.kid;
    
        promise = options.certFunc.fetch(kid)
          .then((key) => {
            options.publicKey = key;
            return verify(token, key);
          })
          .catch(err => reply(Boom.unauthorized(null, 'keycloak-jwt')));
      } else {
        promise = verify(token, options.publicKey);
      }
    
      return promise
        .then((response) => {
          const unauthorized = !(typeof response === 'boolean' && response === true);
          if (!unauthorized) {
            return reply.continue({
              credentials: decoded.payload,
              artifacts: token
            });
          }
          return reply(Boom.unauthorized(null, 'keycloak-jwt'));
        });
    }
  };
}

module.exports = controller;
