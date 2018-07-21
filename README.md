# simple-logger
> Provide the basic logging mechanism.  It can be easy to inject the storage logic for those logging result.

[![Build Status](https://travis-ci.org/leocwlam/simple-logger.svg?branch=master)](https://travis-ci.org/leocwlam/simple-logger)
[![Coverage Status](https://coveralls.io/repos/github/leocwlam/simple-logger/badge.svg?branch=master)](https://coveralls.io/github/leocwlam/simple-logger?branch=master)
[![Dependency Status](https://david-dm.org/leocwlam/simple-logger.svg)](https://david-dm.org/leocwlam/simple-logger.svg)
[![devDependency Status](https://david-dm.org/leocwlam/simple-logger/dev-status.svg)](https://david-dm.org/leocwlam/simple-logger#info=devDependencies)

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

