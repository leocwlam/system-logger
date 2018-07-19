# simple-logger
> Provide the basic logging mechanism.  It can be easy to inject the storage logic for those logging result.

## Usage
```js
const logging = require('simple-logger');

const logConfig = {};
logConfig.log = {};
logConfig.log.level = logging.level.silly;
logging.setupLogConfig(logConfig);

logging.log('error',`Fail Log Tests`, {Error: err});
logging.log('warn',`Warn Log Tests`, {Error: err});
logging.log('info',`Information Log Tests`, {cId: '34a343a3-7cd0-4d88-a8ed-733ba36d3a3c', action: {id: 879}});
logging.log('verbose',`Verbose Log Tests`, {oject: {message: 'test'}});
logging.log('debug',`Debug Log Tests`, {oject: {id: 123, name='tester'}}});
logging.log('silly',`Silly Log Tests`);
```

## License

Apache 2.0

