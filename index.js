const Controller = require('./lib/controller');

exports.register = (server, options, next) => {
    const jwtController = new Controller(options);
    const verifyFunc = jwtController.verifyFunc;
    server.register(require('hapi-auth-jwt2'), (err) => {
        if (err) {
            return next(err);
        }

        //JWT validation setup
        server.auth.strategy('jwt', 'jwt', {
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
  
exports.register.attributes = {
    name: 'hapi-auth-jwtcloak',
    version: '1.0.3'
};