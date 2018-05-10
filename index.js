const Controller = require('./lib/controller');
const pkg = require('./package.json');

exports.register = (server, options, next) => {
    const jwtController = new Controller(options);
    const verifyFunc = jwtController.verifyFunc;
    server.register(require('hapi-auth-jwt2'), (err) => {
        if (err) {
            return next(err);
        }
        const strategy = options.strategy ? options.strategy : 'jwt';

        //JWT validation setup
        server.auth.strategy(strategy, 'jwt', {
            //returns headers & signature
            complete: true, 
            verifyFunc: verifyFunc.bind(jwtController)
        });
  
        if (options.setAsDefaultAuth) {
          server.auth.default('jwt');
        }
        return next();
    });
}

exports.register.attributes = { pkg };