# system-logger
> Provide the basic logging mechanism.  It can be easy to inject the storage logic for those logging result.

[![Build Status](https://travis-ci.org/leocwlam/system-logger.svg?branch=master)](https://travis-ci.org/leocwlam/system-logger)
[![Coverage Status](https://coveralls.io/repos/github/leocwlam/system-logger/badge.svg?branch=master)](https://coveralls.io/github/leocwlam/system-logger?branch=master)
[![Dependency Status](https://david-dm.org/leocwlam/system-logger.svg)](https://david-dm.org/leocwlam/system-logger.svg)
[![devDependency Status](https://david-dm.org/leocwlam/system-logger/dev-status.svg)](https://david-dm.org/leocwlam/system-logger#info=devDependencies)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
<p align="center">
  <a href="https://www.npmjs.com/package/system-logger">
    <img alt="npm latest version" src="https://img.shields.io/npm/v/system-logger/latest.svg">
  </a>
</p>

# Contents
* [Quick Start](#quick-start)
* [Definition](#definition)
* [Example](#example)
* [License](#license)


# <a name="quick-start"></a>Quick Start
**Install via npm:**
```bash
npm install system-logger --save
```

# <a name="definition"></a>Definition

``` js
const logging = require('system-logger');
```
## logging.log(level, message, options)
- `level`: Logging level representing priorities (`error`, `warn`, `info`, `verbose`, `debug`, `silly`)
- `message`: Major information
- `options`: optional information


# <a name="example"></a>Example
```js
const logging = require('system-logger');

const logConfig = {};
logConfig.log = {};
logConfig.log.level = logging.level.silly;
logging.setupLogConfig(logConfig);

logging.log('error',`Fail Log Message`, {Error: err});
logging.log('warn',`Warn Log Message`, {Warn: 'Should not happening'});
logging.log('info',`Information Log Message`, {cId: '34a343a3-7cd0-4d88-a8ed-733ba36d3a3c', action: {id: 879}});
logging.log('verbose',`Verbose Log Message`, {event: {type: 'open', message: 'test'}});
logging.log('debug',`Debug Log Message`, {: {id: 123, name: 'tester'}});
logging.log('silly',`Silly Log Message`);
```


# <a name="license"></a>License
Apache 2.0

