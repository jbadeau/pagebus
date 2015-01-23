(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../Utils' ], factory);
	}
	else {
		root.Widget = factory(root.Utils);
	}
}(this, function(Utils) {

	'use strict';

	function MessageBuilder(message) {
		this._message = {};
	}

	MessageBuilder.prototype = {

		_message : null,

		setFormatVersion : function(formatVersion) {
			this._message.formatVersion = formatVersion;
			return this;
		},

		setTopic : function(topic) {
			this._message.topic = topic;
			return this;
		},

		setClientId : function(clientId) {
			this._message.clientId = clientId;
			return this;
		},

		setBody : function(body) {
			this._message.body = body;
			return this;
		},

		validate : function() {
			if (!this._message.body || this._message.body === null) {
				throw new Error('body is undefined, null or invalid');
			}
			if (!this._message.clientId || this._message.clientId === null) {
				throw new Error('clientId is undefined, null or invalid');
			}
		},

		toJson : function() {
			this._message.formatVersion = this._message.formatVersion || 1;
			this._message.timestamp = Date.now();
			this._message.Id = Utils.guid();
			this.validate();
			// remove any functions and detect cycles
			return JSON.parse(JSON.stringify(message));
		}

	};

	return MessageBuilder;

}));