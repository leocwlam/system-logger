'use strict';

const winston  = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, colorize, printf } = format;
const winstonDailyRotateFile  = require('winston-daily-rotate-file');

// Note: LOGLEVEL should be match winston.levels (instead using winston.levels, we have the custom level, so we don't need to depend on winston, when winston changes)
const LOGLEVEL = {
	error : 0,
	warn : 1,
	info : 2,
	verbose : 3,
	debug : 4,
	silly : 5
};

const LOGFILEROTATE = {
	monthly : 0,
	weekly : 1,
	daily : 2,
	hourly : 3,
	minutely : 4
};

let externalSource = null;
let silent = false;
let externalDisplayFormat = null;
let saveToFileName = null;
let isFileRotate = false;
let	fileRotateType = LOGFILEROTATE.daily;
let fileRotateMaxSize = '1g';		   // add 'k', 'm', or 'g', as 100m

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

function logFileRotateDatePattern(logRotateType) {
	let result = null;
	if ((logRotateType === null) || (typeof logRotateType === 'undefined')) {
		return result;
	}

	switch (logRotateType) {
	case LOGFILEROTATE.monthly:
		result = 'YYYY-MM';
		break;
	case LOGFILEROTATE.weekly:
		result = 'YYYY-[W]WW';
		break;
	case LOGFILEROTATE.daily:
		result = 'YYYY-MM-DD';
		break;
	case LOGFILEROTATE.hourly:
		result = 'YYYY-MM-DDTHH';
		break;
	case LOGFILEROTATE.minutely:
		result = 'YYYY-MM-DDTHH_mm';
		break;
	}
	return result;
}

function fileTransport(filename, isRotate, logRotateType) {
	if (isRotate) {
		let filenameFormat = './%DATE%.log';
		if (filename !== null) {
			const locationExt = filename.lastIndexOf('.');
			filenameFormat = `${filename}%DATE%`;
			if (locationExt > 0) {
				filenameFormat = `${filename.slice(0,locationExt)}%DATE%${filename.slice(locationExt)}`;
			}
		}

		const rotateDatePattern = logFileRotateDatePattern(logRotateType);

		return new winstonDailyRotateFile({
			name: 'dailyLogFile.info',
			datePattern: rotateDatePattern,
			filename: filenameFormat,
			maxsize: fileRotateMaxSize
		});
	} else if (filename !== null) {
		return new transports.File({ name: 'logFile.info', filename: filename });
	}
	return null;
}

function generateWinstonLogger(level, newTransports) {
	let customtransports = [new transports.Console({
		name: 'console.info',
		level: internalLevel(level),
		showLevel: true
    })];

	if (!((newTransports === null) || (typeof newTransports === 'undefined'))) {
		customtransports = newTransports;
	}

	const displayFormat = printf(info => {
		if (externalDisplayFormat !== null) {
			return externalDisplayFormat(info);
		}

		if ((info.optional === null) || (typeof info.optional === 'undefined')) {
			return `${info.timestamp} ${info.level}: ${info.message}`;
		} else {
			let errorDetail = info.optional;
			if ((typeof errorDetail === 'object')) {
				if ((errorDetail.name === null) || (typeof errorDetail.name === 'undefined')) {
					errorDetail = JSON.stringify(errorDetail);
				} else {
					errorDetail = `{${info.optional}}`;
				}
			}
			return `${info.timestamp} ${info.level}: ${info.message} [Detail: ${errorDetail}]`;
		}
	});
	const filetran =  fileTransport(saveToFileName, isFileRotate, fileRotateType);
	if(filetran !== null) {
		customtransports.push(filetran);
	}

	return createLogger({
			level: internalLevel(level),
			format: combine(colorize(),
							timestamp({
								format: 'YYYY-MM-DD HH:mm:ss'			// local time format
								}), displayFormat),
			transports: customtransports,
			silent: silent
		});
}

function loggerLevel() {
	return converseLeveValue(logger.level);
}

let logger = generateWinstonLogger(LOGLEVEL.info);

function optionalParser(optional) {
	const result = [];

	if ((optional !== null) && (optional.cId !== null) && (typeof optional.cId !== 'undefined')) {
		result['cid'] = optional.cId;
	} else if ((optional !== null) && (optional.cid !== null) && (typeof optional.cid !== 'undefined')) {
		result['cid'] = optional.cid;
	}

	return result;
}

function internalLog(logMessage) {
	logger.log({level: logMessage.level, message: logMessage.message, optional: logMessage.optional});
}

function parseLogMessage(level, message, optional, callback) {
	const levelValue = converseLeveValue(level);

	if (externalSource.levels.indexOf(levelValue) !== -1) {
		const persistType = levelValue;
		let persistMessage = null;
		let persistDetail = null;
		let persistCId = null;

		if (typeof message !== 'undefined') {
			persistMessage = message;
		}
		if ((optional !== null) && (typeof optional !== 'undefined')) {
			try {
				persistDetail = JSON.stringify(optional);
			} catch(error) {
				internalLog({level: 'error', message: `Fail To log ${optional}`, optional: error});
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
	internalLog({level: level, message: message, optional: optional});

	return new Promise(async function (resolve) {
		if (externalSource !== null) {
			try {
				await persistExternalSource(level, message, optional);
			} catch (error) {
				internalLog({level: 'error', message: `Fail To log ${message} to External Source`, optional: error});
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

const overrideExternalSource = function (levels, connector, callback) {
	externalSource.levels = levels;
	externalSource.connector = connector;
	externalSource.callback = callback;
};

const setupLogConfig = function (config) {
	silent = false;
	if (!((config.log.silent === null) || (typeof config.log.silent === 'undefined'))) {
		silent = config.log.silent;
	}

	externalDisplayFormat = null;
	if (!((config.log.externalDisplayFormat === null) || (typeof config.log.externalDisplayFormat === 'undefined'))) {
		externalDisplayFormat = config.log.externalDisplayFormat;
	}

	saveToFileName = null;
	if (!((config.log.saveToFileName === null) || (typeof config.log.saveToFileName === 'undefined') || (config.log.saveToFileName === ''))) {
		saveToFileName = config.log.saveToFileName;
	}

	isFileRotate = false;
	if ((config.log.isFileRotate !== null) && (typeof config.log.isFileRotate === 'boolean')) {
		isFileRotate = config.log.isFileRotate;
	}

	fileRotateType = LOGFILEROTATE.daily;
	// Calling logFileRotateDatePattern is only for validation
	if (logFileRotateDatePattern(config.log.fileRotateType) !== null) {
		fileRotateType = config.log.fileRotateType;
	}
	fileRotateMaxSize = '1g';		   // add 'k', 'm', or 'g', as 100m
	if (!((config.log.fileRotateMaxSize === null) || (typeof config.log.fileRotateMaxSize === 'undefined') || (config.log.fileRotateMaxSize === ''))) {
		fileRotateMaxSize = config.log.fileRotateMaxSize;
	}

	externalSource = null;
	if (!((config.source === null) || (typeof config.source === 'undefined'))) {
		externalSource = {};
		overrideExternalSource(config.source.levels, config.source.connector, config.source.callback);
	}

	overrideLogLevel(config.log.level);
};

module.exports.log = log;
module.exports.level = LOGLEVEL;
module.exports.fileRotateType = LOGFILEROTATE;
module.exports.setupLogConfig = setupLogConfig;
module.exports.loggerLevel = loggerLevel;
module.exports.overrideLogLevel = overrideLogLevel;
module.exports.converseLeveValue = converseLeveValue;

