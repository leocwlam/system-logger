'use strict';

class MockExternalSource {

	constructor() {
		this.connector = this;
		this.type = null;
		this.message = null;
		this.detail = null;
		this.cId = null;
    }

	async save(connector, type, message, detail, cId) {
		this.connector = connector;
		this.type = type;
		this.message = message;
		this.detail = detail;
		this.cId = cId;
	}

	async saveFail(connector, type, message, detail, cId) {
		throw new Error('Test fail');
	}
}

module.exports.MockExternalSource = MockExternalSource;
