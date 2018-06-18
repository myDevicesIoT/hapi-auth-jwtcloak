const JWT  = require('jsonwebtoken');
const Boom = require('boom');
const request = require('request');
const KeyCloakCerts = require('./getPublicKey');
const _ = require('lodash');

function JWTController(options) {
  this.issuers = options.issuers;

  this.init();
}

JWTController.prototype.init = function() {
  const self = this;
  
  _.each(self.issuers, (iss) => {
    if (iss.provider === 'keycloak' && iss.options.usePublicKey) {
      const kcCerts = new KeyCloakCerts(iss.options.baseUrl, iss.options.realm);
      iss.options.certFunc = kcCerts;
    }
  });

}

JWTController.prototype.isKeycloakIssuer = function(issuer) {
  return !_.isEmpty(_.find(this.issuers, { issuer: issuer, provider: 'keycloak' }));
}

JWTController.prototype.keycloakHandler = function(decoded, req, callback) {
  let payload = decoded.payload;
  const issuer = payload.iss;
  const token = req.auth.token;    
  
  let issuerOptions = _.find(this.issuers, { issuer: issuer });

  if (!issuerOptions.options.usePublicKey) {
    // handle validation using keycloak introespect
    return this.keycloakIntrospect(payload, issuerOptions, token, callback);
  }

  const verify = (key) => {
    let data;
    try {
      data = JWT.verify(token, key);

      if (issuerOptions.options.filterFunc) {
        data = issuerOptions.options.filterFunc(data);
      }
      data.isKeycloakAuthenticated = true;

      if (!_.isNil(issuerOptions.defaultScopes)) {
        if (_.isNil(data.scope)) {
          data.scope = [];
        }
        data.scope = _.uniq(data.scope.concat(issuerOptions.defaultScopes))
      }

      const tokenScope = _.get(payload, 'scope', null);
      if (typeof tokenScope === 'string') {
        data.scope = payload.scope.split(' ');
      }

      callback(null, true, data);
    } catch (err) {
      callback(null, false);
    }
  }

  if (_.isEmpty(issuerOptions.publicKey)) {
      //fetch it
      issuerOptions.options.certFunc
      .fetch(decoded.header.kid)
      .then(key => {
        issuerOptions.publicKey = key;
        verify(key);
      })
      .catch(err => {
        return callback(err);
      })
  } else {
    return verify(issuerOptions.publicKey);
  }
}

JWTController.prototype.keycloakIntrospect = function(payload, data, token, callback) {
  const basicToken = Buffer.from(`${data.options.clientId}:${data.options.clientSecret}`).toString('base64');
  
  request.post({
    url: `${data.issuer}/protocol/openid-connect/token/introspect`,
    form: { token: token },
    headers: {
      'authorization': `Basic ${basicToken}`,
      'connection': 'keep-alive'
    }
  }, (err, response, bodyResponse) => {
    if (err) {
      return callback(err, false);
    }

    let json;

    try {
      json = JSON.parse(bodyResponse);
    } catch(exp) {
      return callback(exp, false);
    }

    if (!json.active) {
      return callback(Boom.unauthorized(), false);
    }

    payload.isKeycloakAuthenticated = true;

    if (!_.isNil(data.defaultScopes)) {
      if (_.isNil(payload.scope)) {
        payload.scope = [];
      }
      payload.scope = _.uniq(payload.scope.concat(data.defaultScopes));
    }

    const tokenScope = _.get(payload, 'scope', null);
    if (typeof tokenScope === 'string') {
      payload.scope = payload.scope.split(' ');
    }

    return callback(null, true, payload);
  });
}

/**
 * @param {Object} decoded - JWT Decoded object
 * @param {String} decoded.iss - Issuer
 * @param {String} decoded.aud - Audience
 * @param {String} decoded.exp - Expiration
 * @param {String} decoded.sub - Keycloak User Id
 * @param {String} decoded.scope - Scope (optional)
 * @param {String} decoded.user_id - Legacy Asgard User Id
 * @param {String} decoded.email - Email
 */
JWTController.prototype.verifyFunc = function(decoded, req, callback) {
  const payload = decoded.payload;
  if (this.isKeycloakIssuer(payload.iss)) {
    return this.keycloakHandler(decoded, req, callback);
  }

  const issuer = _.find(this.issuers, { issuer: payload.iss, provider: 'jwt' });
  if(!issuer){
    return callback(Boom.unauthorized(), false);
  }
  const verifyOptions = {
    algorithms: issuer.options.algorithms,
    issuer: payload.iss
  };

  JWT.verify(req.auth.token, issuer.options.key, verifyOptions, function (err, decoded) {
    if (err) {
      return callback(Boom.unauthorized(), false);
    }

    if (issuer.options.filterFunc) {
      payload = issuer.options.filterFunc(payload);
    }
    payload.isJwtAuthenticated = true;

    return callback(null, true, payload);
  });
}

module.exports = JWTController;