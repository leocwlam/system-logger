'use strict'

const winston = require('winston')
const { createLogger, format, transports } = winston
const { combine, timestamp, colorize, printf } = format
const WinstonDailyRotateFile = require('winston-daily-rotate-file')

// Note: LOGLEVEL should be match winston.levels (instead using winston.levels, we have the custom level, so we don't need to depend on winston, when winston changes)
const LOGLEVEL = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5
}

const LOGFILEROTATE = {
  monthly: 0,
  weekly: 1,
  daily: 2,
  hourly: 3,
  minutely: 4
}

const DEFAULTISFILEROTATE = false
const DEFAULTFILEROTATETYPE = LOGFILEROTATE.daily
const DEFAULTFILEROTATEMAXSIZE = '1g' // add 'k', 'm', or 'g', as 100m

const converseLeveValue = function (level) {
  let levelValue = 0
  switch (level) {
    case 'error':
      levelValue = LOGLEVEL.error
      break
    case 'warn':
      levelValue = LOGLEVEL.warn
      break
    case 'info':
      levelValue = LOGLEVEL.info
      break
    case 'verbose':
      levelValue = LOGLEVEL.verbose
      break
    case 'debug':
      levelValue = LOGLEVEL.debug
      break
    case 'silly':
      levelValue = LOGLEVEL.silly
      break
  }
  return levelValue
}

function internalLevel (logLevel) {
  let levelValue = 'error'
  switch (logLevel) {
    case LOGLEVEL.error:
      levelValue = 'error'
      break
    case LOGLEVEL.warn:
      levelValue = 'warn'
      break
    case LOGLEVEL.info:
      levelValue = 'info'
      break
    case LOGLEVEL.verbose:
      levelValue = 'verbose'
      break
    case LOGLEVEL.debug:
      levelValue = 'debug'
      break
    case LOGLEVEL.silly:
      levelValue = 'silly'
      break
  }
  return levelValue
}

function logFileRotateDatePattern (logRotateType) {
  let result = null
  if ((logRotateType === null) || (typeof logRotateType === 'undefined')) {
    return result
  }

  switch (logRotateType) {
    case LOGFILEROTATE.monthly:
      result = 'YYYY-MM'
      break
    case LOGFILEROTATE.weekly:
      result = 'YYYY-[W]WW'
      break
    case LOGFILEROTATE.daily:
      result = 'YYYY-MM-DD'
      break
    case LOGFILEROTATE.hourly:
      result = 'YYYY-MM-DDTHH'
      break
    case LOGFILEROTATE.minutely:
      result = 'YYYY-MM-DDTHH_mm'
      break
  }
  return result
}

function fileTransport (filename, isRotate, logRotateType, fileRotateMaxSize) {
  if (isRotate) {
    let filenameFormat = './%DATE%.log'
    if (filename !== null) {
      const locationExt = filename.lastIndexOf('.')
      filenameFormat = `${filename}%DATE%`
      if (locationExt > 0) {
        filenameFormat = `${filename.slice(0, locationExt)}%DATE%${filename.slice(locationExt)}`
      }
    }

    const rotateDatePattern = logFileRotateDatePattern(logRotateType)

    return new WinstonDailyRotateFile({
      name: 'dailyLogFile.info',
      datePattern: rotateDatePattern,
      filename: filenameFormat,
      maxsize: fileRotateMaxSize
    })
  } else if (filename !== null) {
    return new transports.File({ name: 'logFile.info', filename: filename })
  }
  return null
}

function generateLogger (level, externalDisplayFormat, silent, fileSetting) {
  const customtransports = [new transports.Console({
    name: 'console.info',
    level: internalLevel(level),
    format: format.colorize(),
    handleExceptions: true,
    humanReadableUnhandledException: true
  })]

  const displayFormat = printf(info => {
    if (externalDisplayFormat !== null) {
      return externalDisplayFormat(info)
    }

    if ((info.optional === null) || (typeof info.optional === 'undefined')) {
      return `${info.timestamp} ${info.level}: ${info.message}`
    } else {
      let errorDetail = info.optional
      if ((typeof errorDetail === 'object')) {
        if ((errorDetail.name === null) || (typeof errorDetail.name === 'undefined')) {
          errorDetail = JSON.stringify(errorDetail)
        } else {
          errorDetail = `{${info.optional}}`
        }
      }
      return `${info.timestamp} ${info.level}: ${info.message} [Detail: ${errorDetail}]`
    }
  })
  const filetran = fileTransport(fileSetting.saveToFileName, fileSetting.isFileRotate, fileSetting.fileRotateType, fileSetting.fileRotateMaxSize)
  if (filetran !== null) {
    customtransports.push(filetran)
  }

  return createLogger({
    level: internalLevel(level),
    format: combine(colorize(),
      timestamp({
        format: 'YYYY-MM-DD HH:mm:ss' // local time format
      }), displayFormat),
    transports: customtransports,
    silent: silent
  })
}

function optionalParser (optional) {
  const result = {}

  if ((optional !== null) && (optional.cId !== null) && (typeof optional.cId !== 'undefined')) {
    result.cId = optional.cId
  } else if ((optional !== null) && (optional.cid !== null) && (typeof optional.cid !== 'undefined')) {
    result.cId = optional.cid
  }

  return result
}

function internalLog (logger, logMessage) {
  logger.log({ level: logMessage.level, message: logMessage.message, optional: logMessage.optional })
}

async function parseLogMessage (logger, level, message, optional, complete, callback) {
  const levelValue = converseLeveValue(level)
  if (logger.externalSource.levels.indexOf(levelValue) !== -1) {
    const persistType = levelValue
    let persistMessage = null
    let persistDetail = null
    let persistCId = null

    if (typeof message !== 'undefined') {
      persistMessage = message
    }
    if ((optional !== null) && (typeof optional !== 'undefined')) {
      try {
        persistDetail = JSON.stringify(optional)
      } catch (error) {
        internalLog(logger, { level: 'error', message: `Fail To log ${optional}`, optional: error })
      }
      const optionalList = optionalParser(optional)
      if (typeof optionalList.cId !== 'undefined') {
        persistCId = optionalList.cId
      }
    }
    await callback(persistType, persistMessage, persistDetail, persistCId)
  }
  complete()
}

function persistExternalSource (logger, level, message, optional) {
  return new Promise(function (resolve, reject) {
    if ((logger.externalSource !== null) && (logger.externalSource.callback !== null) && (logger.externalSource.connector !== null)) {
      parseLogMessage(logger, level, message, optional, resolve, async function (type, message, detail, cId) {
        try {
          await logger.externalSource.callback(logger.externalSource.connector, type, message, detail, cId)
        } catch (error) {
          reject(error)
        }
      }).then(() => {
        resolve()
      })
    } else {
      resolve()
    }
  })
}

function overrideExternalSource (levels, connector, callback) {
  const externalSource = {}
  externalSource.levels = levels
  externalSource.connector = connector
  externalSource.callback = callback
  return externalSource
}

function fileConfiguration (config) {
  const result = {
    saveToFileName: null,
    isFileRotate: DEFAULTISFILEROTATE,
    fileRotateType: DEFAULTFILEROTATETYPE,
    fileRotateMaxSize: DEFAULTFILEROTATEMAXSIZE // add 'k', 'm', or 'g', as 100m
  }

  if ((config === null) || (typeof config === 'undefined')) {
    return result
  }

  if (!((config.saveToFileName === null) || (typeof config.saveToFileName === 'undefined') || (config.saveToFileName === ''))) {
    result.saveToFileName = config.saveToFileName
  }

  if ((config.isFileRotate !== null) && (typeof config.isFileRotate === 'boolean')) {
    result.isFileRotate = config.isFileRotate
  }

  // Calling logFileRotateDatePattern is only for validation
  if (logFileRotateDatePattern(config.fileRotateType) !== null) {
    result.fileRotateType = config.fileRotateType
  }

  if (!((config.fileRotateMaxSize === null) || (typeof config.fileRotateMaxSize === 'undefined') || (config.fileRotateMaxSize === ''))) {
    result.fileRotateMaxSize = config.fileRotateMaxSize
  }
  return result
}

function sourceConfiguration (config) {
  let result = null

  if ((config === null) || (typeof config === 'undefined')) {
    return result
  }

  result = overrideExternalSource(config.levels, config.connector, config.callback)

  return result
}

class Logger {
  constructor (config, fileConfig, sourceConfig) {
    this.silent = false
    this.externalDisplayFormat = null
    this.fileConfig = null
    this.externalSource = null
    this.logger = null
    this.setupLogConfig(config, fileConfig, sourceConfig)
  }

  setupLogConfig (config, fileConfig, sourceConfig) {
    this.silent = false
    if (!((config.silent === null) || (typeof config.silent === 'undefined'))) {
      this.silent = config.silent
    }

    this.externalDisplayFormat = null
    if (!((config.externalDisplayFormat === null) || (typeof config.externalDisplayFormat === 'undefined'))) {
      this.externalDisplayFormat = config.externalDisplayFormat
    }

    this.fileConfig = fileConfiguration(fileConfig)

    this.externalSource = sourceConfiguration(sourceConfig)

    this.logger = generateLogger(config.level, this.externalDisplayFormat, this.silent, this.fileConfig)
  }

  // e.g.
  // log('warn', 'No Result from Get method', {
  //                    Reason: 'No result return within the config timeout "' + config.timeout + '"'
  //                })
  log (level, message, optional) {
    internalLog(this.logger, { level: level, message: message, optional: optional })
    return new Promise((resolve) => {
      if (this.externalSource !== null) {
        persistExternalSource(this, level, message, optional)
          .then(() => {
            resolve()
          }).catch((error) => {
            internalLog(this.logger, { level: 'error', message: `Fail To log ${message} to External Source`, optional, error })
            resolve()
          })
      } else {
        resolve()
      }
    })
  }
}

module.exports.Logger = Logger
module.exports.level = LOGLEVEL
module.exports.fileRotateType = LOGFILEROTATE
