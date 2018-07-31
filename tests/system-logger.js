'use strict';

const fs = require("fs");
const chai = require('chai');
const expect = chai.expect;

const logging = require('../system-logger');
const testHelper = require('./testHelper');

const DELAYTOCHECKTESTLOGFILE = 1000;
const TESTLOGFILE = './tests/testArea/test.log';

describe('logging Tests', function() {
	after(() => {
		fs.unlinkSync(TESTLOGFILE);
	});
	describe('Setting Tests', function() {
		it('verify converseLeveValue', function() {
			expect(logging.converseLeveValue(logging.level.error)).to.equal(logging.level.error);
			expect(logging.converseLeveValue('error')).to.equal(logging.level.error);

			expect(logging.converseLeveValue(logging.level.warn)).to.equal(logging.level.warn);
			expect(logging.converseLeveValue('warn')).to.equal(logging.level.warn);

			expect(logging.converseLeveValue(logging.level.info)).to.equal(logging.level.info);
			expect(logging.converseLeveValue('info')).to.equal(logging.level.info);

			expect(logging.converseLeveValue(logging.level.verbose)).to.equal(logging.level.verbose);
			expect(logging.converseLeveValue('verbose')).to.equal(logging.level.verbose);

			expect(logging.converseLeveValue(logging.level.debug)).to.equal(logging.level.debug);
			expect(logging.converseLeveValue('debug')).to.equal(logging.level.debug);

			expect(logging.converseLeveValue(logging.level.silly)).to.equal(logging.level.silly);
			expect(logging.converseLeveValue('silly')).to.equal(logging.level.silly);

			expect(logging.converseLeveValue('undefined')).to.equal(0);
		});

		it('Testing logging setupLogConfig with difference level', function() {
			const logConfig = {};
			logConfig.log = {};
			logConfig.log.level = logging.level.error;
			logging.setupLogConfig(logConfig);
			expect(logging.loggerLevel()).to.equal(logging.level.error);

			logConfig.log.level = logging.level.warn;
			logging.setupLogConfig(logConfig);
			expect(logging.loggerLevel()).to.equal(logging.level.warn);

			logConfig.log.level = logging.level.info;
			logging.setupLogConfig(logConfig);
			expect(logging.loggerLevel()).to.equal(logging.level.info);

			logConfig.log.level = logging.level.verbose;
			logging.setupLogConfig(logConfig);
			expect(logging.loggerLevel()).to.equal(logging.level.verbose);

			logConfig.log.level = logging.level.debug;
			logging.setupLogConfig(logConfig);
			expect(logging.loggerLevel()).to.equal(logging.level.debug);

			logConfig.log.level = logging.level.silly;
			logging.setupLogConfig(logConfig);
			expect(logging.loggerLevel()).to.equal(logging.level.silly);
		});

		it('Testing logging without external source', function() {
			const logConfig = {};
			logConfig.log = {};
			logConfig.log.level = logging.level.error;
			logging.setupLogConfig(logConfig);

			logging.log('info');
			logging.log('verbose', 'test message');
			logging.log('silly', null, {Detail: 'test'});
			logging.log('info',`Simple Log Tests`, {Detail: 'test', cid: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' });
			logging.log('warn',`Simple Log Tests`, {Detail: 'test', cId: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' });

		});

		it('Testing logging with export file log', function() {
			let logConfig = {};
			logConfig.log = {};
			logConfig.log.level = logging.level.info;
			logConfig.log.silent = true;
			logConfig.log.saveToFileName = TESTLOGFILE;	// Also support absolute path e.g. `c:\\temp`
			logging.setupLogConfig(logConfig);

			logging.log('info');
			logging.log('verbose', 'test message');
			logging.log('silly', null, {Detail: 'test'});
			logging.log('info',`Simple Log Tests`, {Detail: 'test', cid: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' });
			logging.log('warn',`Simple Log Tests`, {Detail: 'test', cId: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' });


			logConfig.log.saveToFileFolder = null;
			logging.setupLogConfig(logConfig);

			logging.log('info');
			logging.log('verbose', 'test message');
			logging.log('silly', null, {Detail: 'test'});
			logging.log('info',`Simple Log Tests 11`, {Detail: 'test', cid: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' });
			logging.log('warn',`Simple Log Tests 12`, {Detail: 'test', cId: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' });

			setTimeout(function() {
				expect(fs.existsSync(TESTLOGFILE)).to.equal(true);
			}, DELAYTOCHECKTESTLOGFILE);
		});

		it('Testing logging with external source', function() {
			const logConfig = {};
			logConfig.log = {};
			logConfig.log.level = logging.level.error;

			const externalSource = new testHelper.MockExternalSource();
			logConfig.source = {levels:[logging.level.error, logging.level.warn, logging.level.info], dBConnector: externalSource.connector, callback: externalSource.save};
			logging.setupLogConfig(logConfig);

			logging.log('info');
			logging.log('verbose', 'test message');
			logging.log('silly', null, {Detail: 'test'});
			logging.log('info',`Simple Log Tests`, {Detail: 'test', cid: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' });
			logging.log('warn',`Simple Log Tests`, {Detail: 'test', cId: '9c4f5aba-6cb5-4b06-aa50-d6718a41f350' });
		});

		it('Testing logging with external source without calling to callback (no connector)', function() {
			const logConfig = {};
			logConfig.log = {};
			logConfig.log.level = logging.level.error;

			const externalSource = new testHelper.MockExternalSource();
			logConfig.source = {levels:[logging.level.error, logging.level.warn, logging.level.info], dBConnector: null, callback: externalSource.save};
			logging.setupLogConfig(logConfig);
			logging.log('info');
			logging.log('verbose', 'test message');
			logging.log('silly', null, {Detail: 'test'});
			logging.log('info',`Fail Log Tests`, {Detail: 'test'});
		});

		// This test will make internal fail, it will call EventEmitter memory leak.
		it('Testing logging with external source with fail on processing optional', function() {
			const logConfig = {};
			logConfig.log = {};
			logConfig.log.level = logging.level.error;
			logConfig.log.silent = true;

			const externalSource = new testHelper.MockExternalSource();
			logConfig.source = {levels:[logging.level.error, logging.level.warn, logging.level.info], dBConnector: externalSource.connector, callback: externalSource.save};
			logging.setupLogConfig(logConfig);

			const errorOptional = {};
			errorOptional.a = {b:errorOptional};
			logging.log('info');
			logging.log('verbose', 'test message');
			logging.log('silly', null, errorOptional);
			logging.log('info', `Fail Log Tests`, errorOptional);
		});

		it('Testing logging with external source with fail on external save processing', function() {
			const logConfig = {};
			logConfig.log = {};
			logConfig.log.level = logging.level.error;
			logConfig.log.silent = true;

			const externalSource = new testHelper.MockExternalSource();
			logConfig.source = {levels:[logging.level.error, logging.level.warn, logging.level.info], dBConnector: externalSource.connector, callback: externalSource.saveFail};
			logging.setupLogConfig(logConfig);
			logging.log('info');
			logging.log('verbose', 'test message');
			logging.log('silly', null, {Detail: 'test'});
			logging.log('info', `Fail Log Tests`, {Detail: 'test'});
		});

		it('Test custom display message', function() {
			const logConfig = {};
			logConfig.log = {};
			logConfig.log.level = logging.level.error;
			logConfig.log.silent = false;
			// logConfig.log.externalDisplayFormat = (info) => { return `${info.timestamp} ${info.level}: ${info.message}`;};
			logConfig.log.externalDisplayFormat = (info) => { return ''; };		// No Show anything on console, but we still test function overwritten

			const externalSource = new testHelper.MockExternalSource();
			logConfig.source = {levels:[logging.level.error, logging.level.warn, logging.level.info], dBConnector: externalSource.connector, callback: externalSource.saveFail};
			logging.setupLogConfig(logConfig);

			logging.log('info');
			logging.log('verbose', 'test message');
			logging.log('silly', null, {Detail: 'test'});
			logging.log('info', `Fail Log Tests`, {Detail: 'test'});
		});
	});
});
