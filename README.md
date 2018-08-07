# system-logger
> Provide the basic logging mechanism.  It can be easy to inject the storage logic for those logging result.

[![Build Status](https://travis-ci.org/leocwlam/system-logger.svg?branch=master)](https://travis-ci.org/leocwlam/system-logger)
[![Coverage Status](https://coveralls.io/repos/github/leocwlam/system-logger/badge.svg?branch=master)](https://coveralls.io/github/leocwlam/system-logger?branch=master)
[![Dependency Status](https://david-dm.org/leocwlam/system-logger.svg)](https://david-dm.org/leocwlam/system-logger.svg)
[![devDependency Status](https://david-dm.org/leocwlam/system-logger/dev-status.svg)](https://david-dm.org/leocwlam/system-logger#info=devDependencies)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Greenkeeper badge](https://badges.greenkeeper.io/leocwlam/system-logger.svg)](https://greenkeeper.io/)
<p align="center">
  <a href="https://www.npmjs.com/package/system-logger">
    <img alt="npm latest version" src="https://img.shields.io/npm/v/system-logger/latest.svg">
  </a>
</p>

# Contents
* [Quick Start](#quick-start)
* [Definition](#definition)
* [Example](#example)
	* [Get Start](#get-start)
	* [Save to log file](#save-to-logfile)
	* [Overwrite with message format](#overwrite-with-message-format)
* [Use Case](#use-case)
* [License](#license)


# <a name="quick-start"></a>Quick Start
**Install via npm:**
``` bash
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
## <a name="get-start"></a>Get Start
``` js
const logging = require('system-logger');

const logConfig = {};
logConfig.log = {};
logConfig.log.level = logging.level.silly;
logging.setupLogConfig(logConfig);

logging.log('error',`Fail Log Message`, {error: 'err message'});
logging.log('error',`Fail Log Message`, new Error('Timeout'));
logging.log('error',`Fail Log Message`, [1, '1234']);
logging.log('warn',`Warn Log Message`, {warn: 'Should not happening'});
logging.log('info',`Information Log Message`, 'test message');
logging.log('info',`Information Log Message`, {cId: '34a343a3-7cd0-4d88-a8ed-733ba36d3a3c', action: {id: 879}});
logging.log('verbose',`Verbose Log Message`, {event: {type: 'open', message: 'test'}});
logging.log('debug',`Debug Log Message`, {action: {id: 123, name: 'tester'}});
logging.log('silly',`Silly Log Message`);
```

## <a name="save-to-logfile"></a>Save to log file
``` js
const logging = require('system-logger');

const logConfig = {};
logConfig.log = {};
logConfig.log.saveToFileName = './track.log';
logging.setupLogConfig(logConfig);

logging.log('info',`Information Log Message`, {cId: '34a343a3-7cd0-4d88-a8ed-733ba36d3a3c', action: {id: 879}});
```

##  <a name="overwrite-with-message-format"></a>Overwrite with message format
``` js
const logging = require('system-logger');

const logConfig = {};
logConfig.log = {};
logConfig.log.externalDisplayFormat = (info) => {
		if (!skipLog) {
			if ((info.optional === null) || (typeof info.optional === 'undefined')) {
				return `${info.timestamp} ${info.level}: ${info.message}`;
			} else {
				return `${info.timestamp} ${info.level}: ${info.message} [Detail: {${info.optional}}]`;
			}
		};
logging.setupLogConfig(logConfig);

logging.log('info',`Information Log Message`, {cId: '34a343a3-7cd0-4d88-a8ed-733ba36d3a3c', action: {id: 879}});
```

# <a name="use-case"></a>Use Case
Need to disable the entire logging during testing
``` js
const logging = require('system-logger');

const logConfig = {};
logConfig.log = {};
logConfig.log.saveToFileName = './track.log';
logConfig.log.silent = true;
logging.setupLogConfig(logConfig);

// The following code will execute, but nothing will be logged.
logging.log('info',`Information Log Message`, {cId: '34a343a3-7cd0-4d88-a8ed-733ba36d3a3c', action: {id: 879}});
logging.log('error',`Fail Log Message`, {error: 'err message'});
```

Need to file rotation
``` js
const testfileRotateType = logging.fileRotateType.daily;
const logConfig = {};
logConfig.log = {};
logConfig.log.saveToFileName =  './track.log';
logConfig.log.isFileRotate = true;
logConfig.log.fileRotateType = logging.fileRotateType.daily;

logging.setupLogConfig(logConfig);
logging.log('info', `Information Log Tests`, {Detail: 'test'});
```

Need to persist to DB
``` js
const logExternalCallBack = async function(connector, type, message, detail, cId) {
	const sql = require('mssql');
	const result = await connector.request()
		.input('type_parameter', sql.TinyInt, type)
		.input('cId_parameter', sql.NVarChar, cId)
		.input('message_parameter', sql.NVarChar, message)
		.input('detail_parameter', sql.NVarChar, detail)
		.query(`INSERT INTO Process_Log
				([LogType], [CId], [Message], [Detail])
	     	VALUES
				(@type_parameter,
				@cId_parameter,
				@message_parameter,
				@detail_parameter)`);
		return result;
};

const logConfig = {};
logConfig.log = {};
logConfig.log.level = logging.level.info;
logConfig.log.silent = false;

const mssql = require('mssql');
const localhost = 'localhost';
const database = 'MonitorDB';
const username = 'UserMonitor';
const password = 'Test!23AbcPassword';
const pool = await mssql.connect(`mssql://${username}:${password}@${localhost}/${database}`);
logConfig.source = {levels:[logging.level.error, logging.level.warn, logging.level.info], connector: pool, callback: logExternalCallBack};
logging.setupLogConfig(logConfig);

await logging.log('info',`Simple Log Test`, {Detail: 'test', cid: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' });
pool.close();
```

# <a name="license"></a>License
Apache 2.0

