'use strict'
/* eslint-env mocha */

const fs = require('fs')
const chai = require('chai')

const dateFormat = require('dateformat')

const expect = chai.expect

const systemlogger = require('../src/system-logger')
const { Logger } = systemlogger
const testHelper = require('./testHelper')

const DELAYTOCHECKTESTLOGFILE = 1000
const TESTLOGFILE = './tests/testArea/test'

function rotationSaveFile (filename, fileRotateType) {
  const locationExt = filename.lastIndexOf('.')
  let filenameFormat = `${filename}%DATE%`
  if (locationExt > 0) {
    filenameFormat = `${filename.slice(0, locationExt)}%DATE%${filename.slice(locationExt)}`
  }
  let result = ''
  switch (fileRotateType) {
    case systemlogger.fileRotateType.monthly:
      result = filenameFormat.replace('%DATE%', dateFormat(new Date(), 'yyyy-mm'))
      break
    case systemlogger.fileRotateType.weekly:
      result = filenameFormat.replace('%DATE%', dateFormat(new Date(), 'yyyy- W')).replace(' ', 'W')
      break
    case systemlogger.fileRotateType.daily:
      result = filenameFormat.replace('%DATE%', dateFormat(new Date(), 'yyyy-mm-dd'))
      break
    case systemlogger.fileRotateType.hourly:
      result = filenameFormat.replace('%DATE%', dateFormat(new Date(), 'yyyy-mm-dd HH')).replace(' ', 'T')
      break
    case systemlogger.fileRotateType.minutely:
      result = filenameFormat.replace('%DATE%', dateFormat(new Date(), 'yyyy-mm-dd HH_MM')).replace(' ', 'T')
      break
  }
  return result
}

describe('logging Tests', function () {
  describe('Setting Tests', function () {
    it('Testing logging setupLogConfig with difference level', function () {
      const logConfig = {}
      logConfig.level = systemlogger.level.error
      const logger = new Logger(logConfig)

      logConfig.level = systemlogger.level.warn
      logger.setupLogConfig(logConfig)

      logConfig.level = systemlogger.level.info
      logger.setupLogConfig(logConfig)

      logConfig.level = systemlogger.level.verbose
      logger.setupLogConfig(logConfig)

      logConfig.level = systemlogger.level.debug
      logger.setupLogConfig(logConfig)

      logConfig.level = systemlogger.level.silly
      logger.setupLogConfig(logConfig)
    })

    it('Testing logging without external source', function () {
      const logConfig = {}
      logConfig.level = systemlogger.level.error
      const logger = new Logger(logConfig)

      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, { Detail: 'test' })
      logger.log('info', 'test message', 'test')
      logger.log('info', 'test message', 123)
      logger.log('info', 'test message', [123, 'test'])
      logger.log('info', 'Simple Log Test', { Detail: 'test', cid: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' })
      logger.log('warn', 'Simple Log Test', { Detail: 'test', cId: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' })
      logger.log('debug', 'Simple Log Test')
    })

    it('Testing logging with object', function () {
      class Test {
        constructor () {
          this.name = 'Test'
          this.firstName = 'tester'
          this.lastName = 'tp'
        }
      }
      const logConfig = {}
      logConfig.level = systemlogger.level.error
      const logger = new Logger(logConfig)

      logger.log('info', 'test message', new Error('error message'))
      logger.log('info', 'test message', new Test())
    })

    it('Testing logging with export file log', function () {
      const logConfig = {}
      logConfig.level = systemlogger.level.info
      logConfig.silent = true
      const fileConfig = { saveToFileName: TESTLOGFILE } // Also support absolute path e.g. `c:\\temp`

      const logger = new Logger(logConfig, fileConfig)

      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, { Detail: 'test' })
      logger.log('info', 'Simple Log Test', { Detail: 'test', cid: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' })
      logger.log('warn', 'Simple Log Test', { Detail: 'test', cId: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' })

      logger.setupLogConfig(logConfig)

      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, { Detail: 'test' })
      logger.log('info', 'Simple Log Test', { Detail: 'test', cid: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' })
      logger.log('warn', 'Simple Log Test', { Detail: 'test', cId: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' })

      setTimeout(function () {
        expect(fs.existsSync(TESTLOGFILE)).to.equal(true)
        fs.unlinkSync(TESTLOGFILE)
      }, DELAYTOCHECKTESTLOGFILE)
    })

    it('Testing logging with external source', function () {
      const logConfig = {}
      logConfig.level = systemlogger.level.error

      const externalSource = new testHelper.MockExternalSource()
      const sourceConfig = { levels: [systemlogger.level.error, systemlogger.level.warn, systemlogger.level.info], connector: externalSource.connector, callback: externalSource.save }
      const logger = new Logger(logConfig, null, sourceConfig)

      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, { Detail: 'test' })
      logger.log('info', 'Simple Log Test', { Detail: 'test', cid: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' })
      logger.log('warn', 'Simple Log Test', { Detail: 'test', cId: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' })
    })

    it('Testing logging with external source without calling to callback (no connector)', function () {
      const logConfig = {}
      logConfig.level = systemlogger.level.error

      const externalSource = new testHelper.MockExternalSource()
      const sourceConfig = { levels: [systemlogger.level.error, systemlogger.level.warn, systemlogger.level.info], connector: null, callback: externalSource.save }
      const logger = new Logger(logConfig, null, sourceConfig)
      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, { Detail: 'test' })
      logger.log('info', 'Information Log Test', { Detail: 'test' })
    })

    // This test will make internal fail, it will call EventEmitter memory leak.
    it('Testing logging with external source with fail on processing optional', function () {
      const logConfig = {}
      logConfig.level = systemlogger.level.error
      logConfig.silent = true

      const externalSource = new testHelper.MockExternalSource()
      const sourceConfig = { levels: [systemlogger.level.error, systemlogger.level.warn, systemlogger.level.info], connector: externalSource.connector, callback: externalSource.save }
      const logger = new Logger(logConfig, null, sourceConfig)

      const errorOptional = {}
      errorOptional.a = { b: errorOptional }
      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, errorOptional)
      logger.log('info', 'Information Log Test', errorOptional)
      logger.log('debug', 'debug Log Test')
    })

    it('Testing logging with external source with fail on external save processing', function () {
      const logConfig = {}
      logConfig.level = systemlogger.level.error
      logConfig.silent = true

      const externalSource = new testHelper.MockExternalSource()
      const sourceConfig = { levels: [systemlogger.level.error, systemlogger.level.warn, systemlogger.level.info], connector: externalSource.connector, callback: externalSource.saveFail }
      const logger = new Logger(logConfig, null, sourceConfig)

      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, { Detail: 'test' })
      logger.log('info', 'Information Log Test', { Detail: 'test' })
      logger.log('error', 'Fail Log Test', { Error: 'test' })
    })

    it('Test custom display message', function () {
      const logConfig = {}
      logConfig.level = systemlogger.level.error
      logConfig.silent = false
      // logConfig.externalDisplayFormat = (info) => { return `${info.timestamp} ${info.level}: ${info.message}`;};
      logConfig.externalDisplayFormat = (info) => { return '' } // No Show anything on console, but we still test function overwritten

      const externalSource = new testHelper.MockExternalSource()
      const sourceConfig = { levels: [systemlogger.level.error, systemlogger.level.warn, systemlogger.level.info], connector: externalSource.connector, callback: externalSource.saveFail }
      const logger = new Logger(logConfig, null, sourceConfig)

      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, { Detail: 'test' })
      logger.log('info', 'Information Log Test', { Detail: 'test' })
    })

    describe('Test fileTransport behavior', function () {
      const testCases = [
        systemlogger.fileRotateType.monthly,
        systemlogger.fileRotateType.weekly,
        systemlogger.fileRotateType.daily,
        systemlogger.fileRotateType.hourly,
        systemlogger.fileRotateType.minutely
      ]

      testCases.forEach(function (fileRotateType) {
        it(`Test fileTransport with ${fileRotateType} fileRotateType`, function () {
          const filename = `${TESTLOGFILE}-${fileRotateType}`
          const logConfig = {}
          logConfig.level = systemlogger.level.error
          logConfig.silent = true

          const fileConfig = {}
          fileConfig.saveToFileName = filename
          fileConfig.isFileRotate = true
          fileConfig.fileRotateType = fileRotateType
          fileConfig.fileRotateMaxSize = '1m'

          const logger = new Logger(logConfig, fileConfig)
          logger.log('info')
          logger.log('verbose', 'test message')
          logger.log('silly', null, { Detail: 'test' })
          logger.log('info', 'Information Log Test', { Detail: 'test' })
          setTimeout(function () {
            const outFilename = rotationSaveFile(filename, fileRotateType)
            expect(fs.existsSync(outFilename)).to.equal(true)
            fs.unlinkSync(outFilename)
          }, DELAYTOCHECKTESTLOGFILE)
        })
      })
    })

    it('Test fileTransport fileRotate and file without extension', function () {
      const testfileRotateType = systemlogger.fileRotateType.monthly
      const logConfig = {}
      logConfig.level = systemlogger.level.error
      logConfig.silent = true

      const fileConfig = {}
      fileConfig.saveToFileName = `${TESTLOGFILE}`
      fileConfig.isFileRotate = true
      fileConfig.fileRotateType = testfileRotateType
      fileConfig.fileRotateMaxSize = '1g'

      const logger = new Logger(logConfig, fileConfig)
      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, { Detail: 'test' })
      logger.log('info', 'Information Log Test', { Detail: 'test' })
      setTimeout(function () {
        const outFilename = rotationSaveFile(TESTLOGFILE, testfileRotateType)
        expect(fs.existsSync(outFilename)).to.equal(true)
        fs.unlinkSync(outFilename)
      }, DELAYTOCHECKTESTLOGFILE)
    })

    it('Test fileTransport fileRotate and file with extension', function () {
      const testfileRotateType = systemlogger.fileRotateType.monthly
      const logConfig = {}
      logConfig.level = systemlogger.level.error
      logConfig.silent = true

      const fileConfig = {}
      fileConfig.saveToFileName = `${TESTLOGFILE}.log`
      fileConfig.isFileRotate = true
      fileConfig.fileRotateType = testfileRotateType

      const logger = new Logger(logConfig, fileConfig)
      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, { Detail: 'test' })
      logger.log('info', 'Information Log Test', { Detail: 'test' })
      setTimeout(function () {
        const outFilename = rotationSaveFile(`${TESTLOGFILE}.log`, testfileRotateType)
        expect(fs.existsSync(outFilename)).to.equal(true)
        fs.unlinkSync(outFilename)
      }, DELAYTOCHECKTESTLOGFILE)
    })

    it('Test fileTransport fileRotate with no exist or invalid fileRotateType', function () {
      const testfileRotateType = null
      const logConfig = {}
      logConfig.level = systemlogger.level.error
      logConfig.silent = true

      const fileConfig = {}
      fileConfig.saveToFileName = `${TESTLOGFILE}`
      fileConfig.isFileRotate = true
      fileConfig.fileRotateType = testfileRotateType

      const logger = new Logger(logConfig, fileConfig)
      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, { Detail: 'test' })
      logger.log('info', 'Information Log Test', { Detail: 'test' })
      setTimeout(function () {
        const outFilename = rotationSaveFile(`${TESTLOGFILE}`, systemlogger.fileRotateType.daily)
        expect(fs.existsSync(outFilename)).to.equal(true)
        fs.unlinkSync(outFilename)
      }, DELAYTOCHECKTESTLOGFILE)
    })

    it('Test fileTransport fileRotate with no exist saveToFileName', function () {
      const testfileRotateType = null
      const logConfig = {}
      logConfig.level = systemlogger.level.error
      logConfig.silent = true

      const fileConfig = {}
      fileConfig.saveToFileName = null
      fileConfig.isFileRotate = true
      fileConfig.fileRotateType = testfileRotateType

      const logger = new Logger(logConfig, fileConfig)
      logger.log('info')
      logger.log('verbose', 'test message')
      logger.log('silly', null, { Detail: 'test' })
      logger.log('info', 'Information Log Test', { Detail: 'test' })
      setTimeout(function () {
        const outFilename = `${rotationSaveFile('./', systemlogger.fileRotateType.daily)}.log`
        expect(fs.existsSync(outFilename)).to.equal(true)
        fs.unlinkSync(outFilename)
      }, DELAYTOCHECKTESTLOGFILE)
    })
  })
})
