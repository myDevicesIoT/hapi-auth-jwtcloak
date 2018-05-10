require('dotenv').config();
const request = require('superagent');

const Helper = require('./helper');

const Lab = require('lab');
const { expect } = require('code');
const lab = Lab.script();
const { test, before, beforeEach, afterEach, suite } = lab;

exports.lab = lab;

suite('token validation', () => {
  before(() => Helper.start());

  test('Should be able to access a route that uses public key', () => {
    const url = `${process.env.KEYCLOAK_ISS}/protocol/openid-connect/token`;
    const headers = {
      'content-type': 'application/x-www-form-urlencoded'
    };
    const body = {
      client_id: process.env.KEYCLOAK_APP_ID,
      client_secret: process.env.KEYCLOAK_APP_SECRET,
      grant_type: 'client_credentials'
    };
    return request('POST', url)
      .set(headers)
      .send(body)
      .then((response) => {
        const token = `Bearer ${response.body.access_token}`;
        return Helper.serverInject('GET', '/public', token);
      })
      .then((response) => {
        expect(response.statusCode).to.equal(200);
      });
  });

  test('Should be able to use stored public key', () => {
    let token;
    const url = `${process.env.KEYCLOAK_ISS}/protocol/openid-connect/token`;
    const headers = {
      'content-type': 'application/x-www-form-urlencoded'
    };
    const body = {
      client_id: process.env.KEYCLOAK_APP_ID,
      client_secret: process.env.KEYCLOAK_APP_SECRET,
      grant_type: 'client_credentials'
    };
    return request('POST', url)
      .set(headers)
      .send(body)
      .then((response) => {
        token = `Bearer ${response.body.access_token}`;
        return Helper.serverInject('GET', '/public', token);
      })
      .then((response) => {
        expect(response.statusCode).to.equal(200);
        return Helper.serverInject('GET', '/public', token);
      })
      .then((response) => {
        expect(response.statusCode).to.equal(200);
      });
  });

  test('Should be able to introspect a valid token', () => {
    const url = `${process.env.KEYCLOAK_ISS}/protocol/openid-connect/token`;
    const headers = {
      'content-type': 'application/x-www-form-urlencoded'
    };
    const body = {
      client_id: process.env.KEYCLOAK_APP_ID,
      client_secret: process.env.KEYCLOAK_APP_SECRET,
      grant_type: 'client_credentials'
    };
    return request('POST', url)
      .set(headers)
      .send(body)
      .then((response) => {
        const token = `Bearer ${response.body.access_token}`;
        return Helper.serverInject('GET', '/introspect', token);
      })
      .then((response) => {
        expect(response.statusCode).to.equal(200);
      });
  });

  test('Should be able to use same token against public and introspect routes', () => {
    let token;
    const url = `${process.env.KEYCLOAK_ISS}/protocol/openid-connect/token`;
    const headers = {
      'content-type': 'application/x-www-form-urlencoded'
    };
    const body = {
      client_id: process.env.KEYCLOAK_APP_ID,
      client_secret: process.env.KEYCLOAK_APP_SECRET,
      grant_type: 'client_credentials'
    };
    return request('POST', url)
      .set(headers)
      .send(body)
      .then((response) => {
        token = `Bearer ${response.body.access_token}`;
        return Helper.serverInject('GET', '/introspect', token);
      })
      .then((response) => {
        expect(response.statusCode).to.equal(200);
        return Helper.serverInject('GET', '/public', token);
      })
      .then((response) => {
        expect(response.statusCode).to.equal(200);
      });
  });

  test('Should be able to validate against a multi auth route', () => {
    const url = `${process.env.KEYCLOAK_ISS}/protocol/openid-connect/token`;
    const headers = {
      'content-type': 'application/x-www-form-urlencoded'
    };
    const body = {
      client_id: process.env.KEYCLOAK_APP_ID,
      client_secret: process.env.KEYCLOAK_APP_SECRET,
      grant_type: 'client_credentials'
    };
    return request('POST', url)
      .set(headers)
      .send(body)
      .then((response) => {
        const token = `Bearer ${response.body.access_token}`;
        return Helper.serverInject('GET', '/multiple', token);
      })
      .then((response) => {
        expect(response.statusCode).to.equal(200);
      });
  });

  test('Should be able to validate against a different auth strategy on multi auth route', () => {
    const headers = {
      authorization: 'Basic aGVsbG86d29ybGQ='
    };
    return Helper.serverInject('GET', '/multiple', null, headers)
      .then((response) => {
        expect(response.statusCode).to.equal(200);
      });
  });

  test('Should reject an invalid bearer token', () => {
    const headers = {
      authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJoZWxsbyI6IndvcmxkIiwianRpIjoiZDhlNWVmMzctYTQ4NS00ZmYwLThiMWUtZTZmM2Q0NmIxMGMxIiwiaWF0IjoxNTI1OTM5ODY3LCJleHAiOjE1MjU5NDM0Njd9.6wpiDaBIzmful_3haYY-vuZ_tOlr6-vkws6gk8oMnP4'
    };
    return Helper.serverInject('GET', '/public', null, headers)
      .then((response) => {
        expect(response.statusCode).to.equal(401);
        return Helper.serverInject('GET', '/introspect', null, headers);
      })
      .then((response) => {
        expect(response.statusCode).to.equal(401);
        return Helper.serverInject('GET', '/multiple', null, headers)
      })
      .then((response) => {
        expect(response.statusCode).to.equal(401);
      });
  });

  test('Should be able to access a route that has scoped config', () => {
    const url = `${process.env.KEYCLOAK_ISS}/protocol/openid-connect/token`;
    const headers = {
      'content-type': 'application/x-www-form-urlencoded'
    };
    const body = {
      client_id: process.env.KEYCLOAK_APP_ID,
      client_secret: process.env.KEYCLOAK_APP_SECRET,
      grant_type: 'client_credentials'
    };
    return request('POST', url)
      .set(headers)
      .send(body)
      .then((response) => {
        const token = `Bearer ${response.body.access_token}`;
        return Helper.serverInject('GET', '/scoped', token);
      })
      .then((response) => {
        expect(response.statusCode).to.equal(200);
      });
  });
});
