# hapi-auth-jwtcloak

A Hapi plugin to authenticate multiple JWT issuers. Currently support JWT 1 & 2 (hapi-auth-jwt2) and KeyCloak.

The Keycloak JWT validation defaults to local JWT signing using public key from Keycloak. Validation
using the introspect endpoint is also supported.

<h1>Install</h1>

```
npm install hapi-auth-jwtcloak
-or-
npm install git+https://github.com/myDevicesIoT/hapi-auth-jwtcloak
```

<h1>Configuration</h1>

Parameter Name | Description
--- | ---
`setAsDefaultAuth` | `Boolean` if true, sets `jwt` as the default Hapi authentication strategy when the authentication strategy is not defined for a Hapi route config.
`strategy` | `string` sets the hapi strategy name to use on route configs, defaults to `jwt`.
`issuers[].defaultScopes` | `string[]` adds default scope(s) to the decoded credentials

<h2>Example:</h2>

```
{
    register: require('hapi-auth-jwtcloak'),
    options: {
      setAsDefaultAuth: false,
      issuers: [{
        issuer: 'KEYCLOAK ISSUER',
        provider: 'keycloak',
        options: {
          baseUrl: '',
          realm: 'Realm Name',
          clientId: 'Optional: if validation with introspect ',
          clientSecret: 'Optional: if validation with introspect ',
          usePublicKey: true,
          // tranpose data if that is needed
          filterFunc: function(credentials) {
            
          }
        }
      },
      {
        issuer: 'Standard JWT provider',
        provider: 'jwt',
        options: {
          key: process.env.JWT_TOKEN,
          algorithms: ['HS256']
        }
      }]
    }
  }
  ```
