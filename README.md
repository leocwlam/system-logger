# system-logger
> Provide the basic logging mechanism.  It can be easy to inject the storage logic for those logging result.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/leocwlam/system-logger/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/leocwlam/system-logger.svg?branch=master)](https://travis-ci.org/leocwlam/system-logger)
[![Coverage Status](https://coveralls.io/repos/github/leocwlam/system-logger/badge.svg?branch=master)](https://coveralls.io/github/leocwlam/system-logger?branch=master)
[![Dependency Status](https://david-dm.org/leocwlam/system-logger.svg)](https://david-dm.org/leocwlam/system-logger)
[![devDependency Status](https://david-dm.org/leocwlam/system-logger/dev-status.svg)](https://david-dm.org/leocwlam/system-logger?type=dev)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Greenkeeper badge](https://badges.greenkeeper.io/leocwlam/system-logger.svg)](https://greenkeeper.io/)
[![npm badge](https://img.shields.io/npm/v/system-logger/latest.svg)](https://www.npmjs.com/package/system-logger)


# Contents
-------

<p align="center">
    <a href="#quick-start">Quick Start</a> &bull;
    <a href="#definition">Definition</a> &bull;
    <a href="#example">Example</a> &bull;
    <a href="#use-case">Use Case</a> &bull;
    <a href="#license">License</a>
</p>

-------


# <a name="quick-start"></a>Quick Start
**Install via npm:**
``` bash
npm install system-logger --save
```

# <a name="definition"></a>Definition

``` js
const logger = require('system-logger')
```
## logger.log(level, message, options)
- `level`: Logging level representing priorities (`error`, `warn`, `info`, `verbose`, `debug`, `silly`)
- `message`: Major information
- `options`: optional information


# <a name="example"></a>Example
## <a name="get-start"></a>Get Start
``` js
const systemlogger = require('system-logger')
const { Logger } = systemlogger

const logConfig = { level: systemlogger.level.silly }
const logger = new Logger(logConfig)

logger.log('error', `Fail Log Message`, {error: 'err message'})
logger.log('error', `Fail Log Message`, new Error('Timeout'))
logger.log('error', `Fail Log Message`, [1, '1234'])
logger.log('warn', `Warn Log Message`, {warn: 'Should not happening'})
logger.log('info', `Information Log Message`, 'test message')
logger.log('info', `Information Log Message`, {cId: '34a343a3-7cd0-4d88-a8ed-733ba36d3a3c', action: {id: 879}})
logger.log('verbose', `Verbose Log Message`, {event: {type: 'open', message: 'test'}})
logger.log('debug', `Debug Log Message`, {action: {id: 123, name: 'tester'}})
logger.log('silly', `Silly Log Message`)
```

## <a name="save-to-logfile"></a>Save to log file
``` js
const systemlogger = require('system-logger')
const { Logger } = systemlogger

const logConfig = { level: systemlogger.level.info }
const fileConfig = { saveToFileName: './track.log' }

const logger = new Logger(logConfig, fileConfig)

logger.log('info', `Information Log Message`, {cId: '34a343a3-7cd0-4d88-a8ed-733ba36d3a3c', action: {id: 879}})
```

##  <a name="overwrite-with-message-format"></a>Overwrite with message format
``` js
const systemlogger = require('system-logger')
const { Logger } = systemlogger

const logConfig = { level: systemlogger.level.info }
logConfig.externalDisplayFormat = (info) => {
  if ((info.optional === null) || (typeof info.optional === 'undefined')) {
    return `${info.timestamp} ${info.level}: ${info.message}`
  } else {
    return `${info.timestamp} ${info.level}: ${info.message} [Detail: {cId: ${info.optional.cId}, actionId: ${info.optional.action.id}}]`
  }
}
const logger = new Logger(logConfig)

logger.log('info', `Information Log Message`, {cId: '34a343a3-7cd0-4d88-a8ed-733ba36d3a3c', action: {id: 879}})
```

# <a name="use-case"></a>Use Case
Need to disable the entire logging during testing
``` js
const systemlogger = require('system-logger')
const { Logger } = systemlogger

const logConfig = { level: systemlogger.level.info, silent: true }
const fileConfig = { saveToFileName: './track.log' }

const logger = new Logger(logConfig, fileConfig)

// The following code will execute, but nothing will be logged.
logger.log('info', `Information Log Message`, {cId: '34a343a3-7cd0-4d88-a8ed-733ba36d3a3c', action: {id: 879}})
logger.log('error', `Fail Log Message`, {error: 'err message'})
```

Need to rotate log file
``` js
const systemlogger = require('system-logger')
const { Logger } = systemlogger

const logConfig = { level: systemlogger.level.info }
const fileConfig = { saveToFileName: './track.log', isFileRotate: true, fileRotateType: systemlogger.fileRotateType.daily }

const logger = new Logger(logConfig, fileConfig)
logger.log('info', `Information Log Tests`, {Detail: 'test'})
```

Need to persist to DB
``` js
const systemlogger = require('system-logger')
const { Logger } = systemlogger

const logExternalCallBack = async function (connector, type, message, detail, cId) {
  const sql = require('mssql')
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
      @detail_parameter)`)
  return result
}

const logConfig = { level: systemlogger.level.info }

const mssql = require('mssql')
const localhost = 'localhost'
const database = 'MonitorDB'
const username = 'UserMonitor'
const password = 'Test!23AbcPassword'
const pool = await mssql.connect(`mssql://${username}:${password}@${localhost}/${database}`)
const sourceConfig = { levels: [systemlogger.level.error, systemlogger.level.warn, systemlogger.level.info], connector: pool, callback: logExternalCallBack }

const logger = new Logger(logConfig, null, sourceConfig)

await logger.log('info', `Simple Log Test`, { Detail: 'test', cid: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' })
pool.close()
```

# <a name="license"></a>License
MIT
