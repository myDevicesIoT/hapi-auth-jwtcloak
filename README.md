# hapi-auth-jwtcloak

A hapi plugin to authenticate against keycloak JWT. 


The Keycloak JWT validation defaults to local JWT signing using public key from Keycloak. Validation
using the introspect endpoint is also supported.

<h1>Install</h1>

```
npm install hapi-auth-jwtcloak
-or-
npm install git+https://github.com/myDevicesIoT/hapi-auth-jwtcloak
```

<h1>Configuration</h1>

Field Name | Type | Description
--- | --- | ---
`issuer` | `string` | **Required** The Keycloak token issuer
`baseurl` | `string` | **Required** The base URL of the Keycloak server
`realm` | `string` | **Required** the Keycloak realm to authenticate against
`defaultScopes` | `string[]` | Default scopes to add to decoded credentials
`introspect` | `boolean` | Defaults to `false`. Introspect the Keycloak JWT token (online token verification)
`cientId` | `string` | Required if `introspect` is true. This client id should have access to perform token introspect
`clientSecret` | `string` | Required if `introspect` is true. The secret for the client that has access to perform token introspect.

<h2>Example:</h2>

```
const jwtCloak = require('hapi-auth-jwtcloak');

// Hapi Server instantiate here...

// Register the hapi plugin
server.register({
  register: jwtCloak,
  options: {}
});

// Add the auth strategy (public key verification)
server.auth.strategy('keycloak-jwt-public', 'keycloak-jwt', {
  issuer: process.env.KEYCLOAK_ISS,
  baseUrl: process.env.KEYCLOAK_BASE_URL,
  realm: process.env.KEYCLOAK_REALM,
  introspect: false
});

// Add the auth strategy (introspect key verification)
server.auth.strategy('keycloak-jwt-introspect', 'keycloak-jwt', {
  issuer: process.env.KEYCLOAK_ISS,
  baseUrl: process.env.KEYCLOAK_BASE_URL,
  realm: process.env.KEYCLOAK_REALM,
  introspect: true,
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET
});

// Register the desired auth strategy to a route
server.route({
  method: 'GET',
  path: '/public',
  config: {
    auth: {
      strategies: ['keycloak-jwt-public']
    }
  },
  handler: (request, reply) => reply(request.auth.credentials)
});

// -or- use introspect on another route
server.route({
  method: 'GET',
  path: '/introspect',
  config: {
    auth: {
      strategies: ['keycloak-jwt-introspect']
    }
  },
  handler: (request, reply) => reply(request.auth.credentials)
});
```

<h2>Testing:</h2>

1. Create `.env.` using `.env.example`
2. `KEYCLOAK_CLIENT_ID` and `KEYCLOAK_CLIENT_SECRET` should be a service account that has access to perform token introspect against the keycloak realm.
3. `KEYCLOAK_APP_ID` and `KEYCLOAK_APP_SECRET` should be a client to the realm that at -minimum- has service accounts enabled.
4. `npm test`
