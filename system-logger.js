'use strict';

const winston  = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, prettyPrint  } = format;

// Note: LOGLEVEL should be match winston.levels (instead using winston.levels, we have the custom level, so we don't need to depend on winston, when winston changes)
const LOGLEVEL = {
	error : 0,
	warn : 1,
	info : 2,
	verbose : 3,
	debug : 4,
	silly : 5
};

let externalSource = null;

const converseLeveValue = function (level) {
	let levelValue = -1;
	switch (level) {
	case LOGLEVEL.error:
	case 'error':
		levelValue = LOGLEVEL.error;
		break;
	case LOGLEVEL.warn:
	case 'warn':
		levelValue = LOGLEVEL.warn;
		break;
	case LOGLEVEL.info:
	case 'info':
		levelValue = LOGLEVEL.info;
		break;
	case LOGLEVEL.verbose:
	case 'verbose':
		levelValue = LOGLEVEL.verbose;
		break;
	case LOGLEVEL.debug:
	case 'debug':
		levelValue = LOGLEVEL.debug;
		break;
	case LOGLEVEL.silly:
	case 'silly':
		levelValue = LOGLEVEL.silly;
		break;
	default:
		levelValue = 0;
	}
	return levelValue;
};

function internalLevel(logLevel) {
	let levelValue = 'error';
	switch (logLevel) {
	case LOGLEVEL.error:
		levelValue = 'error';
		break;
	case LOGLEVEL.warn:
		levelValue = 'warn';
		break;
	case LOGLEVEL.info:
		levelValue = 'info';
		break;
	case LOGLEVEL.verbose:
		levelValue = 'verbose';
		break;
	case LOGLEVEL.debug:
		levelValue = 'debug';
		break;
	case LOGLEVEL.silly:
		levelValue = 'silly';
		break;
	}
	return levelValue;
}

function generateWinstonLogger(level, newTransports) {
	let customtransports = [new transports.Console({
		level: internalLevel(level)
    })];

	if (!((newTransports === null) || (typeof newTransports === 'undefined'))) {
		customtransports = newTransports;
	}

	return createLogger({
			level: internalLevel(level),
			format: combine(timestamp(),prettyPrint()),
			transports: customtransports
		});
}

function loggerLevel() {
	return converseLeveValue(logger.level);
}

let logger = generateWinstonLogger(LOGLEVEL.info);

function optionalParser(optional) {
	const result = [];
	if ((optional !== null) && (typeof optional !== 'undefined')) {
		if ((optional.cId !== null) && (typeof optional.cId !== 'undefined')) {
			result['cid'] = optional.cId;
		} else if ((optional.cid !== null) && (typeof optional.cid !== 'undefined')) {
			result['cid'] = optional.cid;
		}
	}
	return result;
}

function parseLogMessage(level, message, optional, callback) {
	const levelValue = converseLeveValue(level);

	if (externalSource.levels.indexOf(levelValue) !== -1) {
		const persistType = levelValue;
		let persistMessage = null;
		let persistDetail = null;
		let persistCId = null;

		if ((message !== null) && (typeof message !== 'undefined')) {
			persistMessage = message;
		}
		if ((optional !== null) && (typeof optional !== 'undefined')) {
			try {
				persistDetail = JSON.stringify(optional);
			} catch(error) {
				logger.log({level: 'error', message: `Fail: To log ${optional}`, optional: error});
			}
			const optionalList = optionalParser(optional);
			if (typeof optionalList['cid'] !== 'undefined') {
				persistCId = optionalList['cid'];
			}
		}
		callback(persistType, persistMessage, persistDetail, persistCId);
	}
}

function persistExternalSource (level, message, optional) {
	return new Promise(function (resolve, reject) {
		if ((externalSource !== null) && (externalSource.callback !== null) && (externalSource.connector !== null)) {
			parseLogMessage(level, message, optional, async function(type, message, detail, cId) {
				try {
					await externalSource.callback(externalSource.connector, type, message, detail, cId);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		} else {
			resolve();
		}
	});
}

// e.g.
// log('warn', 'No Result from Get method', {
//                    Reason: 'No result return within the config timeout "' + config.timeout + '"'
//                })
const log = function (level, message, optional) {
	logger.log({level: level, message: message, optional: optional});
	return new Promise(async function (resolve) {
		if (externalSource !== null) {
			try {
				await persistExternalSource(level, message, optional);
			} catch (error) {
				logger.log('error', `Fail: To log ${message} to External Source`, error);
			}
		}
		resolve();
	});
};


const overrideLogLevel = function (level) {
	const customtransports = [new transports.Console({
		level: internalLevel(level),
		format: format.colorize(),
		handleExceptions: true,
		humanReadableUnhandledException: true
    })];

	logger = generateWinstonLogger(level, customtransports);
};

const overrideExternalSource = function (levels, dBConnector, callback) {
	externalSource.levels = levels;
	externalSource.connector = dBConnector;
	externalSource.callback = callback;
};

const setupLogConfig = function (config) {
	overrideLogLevel(config.log.level);
	externalSource = null;
	if (!((config.source === null) || (typeof config.source === 'undefined'))) {
		externalSource = {};
		overrideExternalSource(config.source.levels, config.source.dBConnector, config.source.callback);
	}
};

module.exports.log = log;
module.exports.level = LOGLEVEL;
module.exports.setupLogConfig = setupLogConfig;
module.exports.loggerLevel = loggerLevel;
module.exports.overrideLogLevel = overrideLogLevel;
module.exports.converseLeveValue = converseLeveValue;
