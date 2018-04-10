# hapi-auth-jwtcloak

A Hapi plugin to authenticate multiple JWT issuers. Currently support JWT 1 & 2 (hapi-auth-jwt2) and KeyCloak.

The Keycloak JWT validation defaults to local JWT signing using public key from Keycloak. Validation
using the introspect endpoint is also supported.

**Install**
```
npm install hapi-auth-jwtcloak
```

**Configuration**
```
{
    register: require('hapi-auth-jwtcloak'),
    options: {
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
