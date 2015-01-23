(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../Errors', './PostMessageIframeHubClient' ], factory);
	}
	else {
		root.IframeHubClient = factory(root.Errors, root.PostMessageIframeHubClient);
	}
}(this, function(Errors, PostMessageIframeHubClient) {

	/**
	 * Create a new IframeHubClient.
	 * 
	 * @constructor
	 * @extends juk.HubClient
	 * 
	 * @param {Object}
	 *            params Once the constructor is called, the params object
	 *            belongs to the HubClient. The caller MUST not modify it. The
	 *            following are the pre-defined properties on params:
	 * @param {Function}
	 *            params.HubClient.onSecurityAlert Called when an attempted
	 *            security breach is thwarted
	 * @param {Object}
	 *            [params.HubClient.scope] Whenever one of the HubClient's
	 *            callback functions is called, references to "this" in the
	 *            callback will refer to the scope object. If not provided, the
	 *            default is window.
	 * @param {Function}
	 *            [params.IframeHubClient.seed] A function that returns a string
	 *            that will be used to seed the pseudo-random number generator,
	 *            which is used to create the security tokens. An implementation
	 *            of IframeHubClient may choose to ignore this value.
	 * @param {Number}
	 *            [params.IframeHubClient.tokenLength] Length of the security
	 *            tokens used when transmitting messages. If not specified,
	 *            defaults to 6. An implementation of IframeHubClient may choose
	 *            to ignore this value.
	 * 
	 * @throws {Error.BadParameters}
	 *             if any of the required parameters is missing, or if a
	 *             parameter value is invalid in some way.
	 */
	function IframeHubClient(params) {
		if (!params || !params.HubClient || !params.HubClient.onSecurityAlert) {
			throw new Error(Errors.BadParameters);
		}

		this._params = params;

		if (window.postMessage) {
			this._delegate = new PostMessageIframeHubClient(this, params);
		}
		else {
			throw new Error(Errors.UnsupportedUserAgent);
		}
	}

	IframeHubClient.prototype = {

		/** * juk.HubClient interface implementation ** */

		connect : function() {
			var promise = new Promise(function(resolve, reject) {
				if (this.isConnected()) {
					reject(new Error(Errors.Duplicate));
				}
				this._delegate.connect(function(client, success, error) {
					if (success) {
						resolve(client);
					}
					else {
						reject(error);
					}
				}, window);
			}.bind(this));
			return promise;
		},

		disconnect : function() {
			var promise = new Promise(function(resolve, reject) {
				if (!this.isConnected()) {
					reject(new Error(Errors.Disconnected));
				}
				this._delegate.disconnect(function(client, success, error) {
					if (success) {
						resolve(client);
					}
					else {
						reject(error);
					}
				}, window);
			}.bind(this));
			return promise;
		},

		getPartnerOrigin : function() {
			return this._delegate.getPartnerOrigin();
		},

		getClientID : function() {
			return this._delegate.getClientID();
		},

		/** * juk.Hub interface implementation ** */

		subscribe : function(topic, onData, scope, subscriberData) {
			var promise = new Promise(function(resolve, reject) {
				this._assertConn();
				this._assertSubTopic(topic);
				if (!onData) {
					reject(new Error(Errors.BadParameters));
				}
				scope = scope || window;
				this._delegate.subscribe(topic, onData, scope, function(subscriptionID, success, error) {
					if (success) {
						resolve(subscriptionID);
					}
					else {
						reject(error);
					}
				}, subscriberData);
			}.bind(this));
			return promise;
		},

		publish : function(topic, data) {
			this._assertConn();
			this._assertPubTopic(topic);
			this._delegate.publish(topic, data);
		},

		unsubscribe : function(subscriptionID) {
			var promise = new Promise(function(resolve, reject) {
				this._assertConn();
				if (typeof subscriptionID === "undefined" || subscriptionID == null) {
					reject(new Error(Errors.BadParameters));
				}
				this._delegate.unsubscribe(subscriptionID, function(subscriptionID, success, error) {
					if (success) {
						resolve(subscriptionID);
					}
					else {
						reject(error);
					}
				}, window);
			}.bind(this));
			return promise;
		},

		isConnected : function() {
			return this._delegate.isConnected();
		},

		getScope : function() {
			return this._delegate.getScope();
		},

		getSubscriberData : function(subscriptionID) {
			this._assertConn();
			return this._delegate.getSubscriberData(subscriptionID);
		},

		getSubscriberScope : function(subscriptionID) {
			this._assertConn();
			return this._delegate.getSubscriberScope(subscriptionID);
		},

		getParameters : function() {
			return this._params;
		},

		/** * Private Functions ** */

		_assertConn : function() {
			if (!this.isConnected()) {
				throw new Error(Errors.Disconnected);
			}
		},

		_assertSubTopic : function(topic) {
			if (!topic) {
				throw new Error(Errors.BadParameters);
			}
			var path = topic.split(".");
			var len = path.length;
			for (var i = 0; i < len; i++) {
				var p = path[i];
				if ((p == "") || ((p.indexOf("*") != -1) && (p != "*") && (p != "**"))) {
					throw new Error(Errors.BadParameters);
				}
				if ((p == "**") && (i < len - 1)) {
					throw new Error(Errors.BadParameters);
				}
			}
		},

		_assertPubTopic : function(topic) {
			if ((topic == null) || (topic == "") || (topic.indexOf("*") != -1) || (topic.indexOf("..") != -1) || (topic.charAt(0) == ".") || (topic.charAt(topic.length - 1) == ".")) {
				throw new Error(Errors.BadParameters);
			}
		}

	};

	return IframeHubClient;

}));