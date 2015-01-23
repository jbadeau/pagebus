(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../SecurityAlerts', '../Errors', './IframeHubClient', './PostMessageIframeContainer' ], factory);
	}
	else {
		root.PostMessageIframeHubClient = factory(root.SecurityAlerts, root.Errors, root.IframeHubClient, root.PostMessageIframeContainer);
	}
}(this, function(SecurityAlerts, Errors, IframeHubClient, PostMessageIframeContainer) {

	/**
	 * Complete connection from HubClient to this Container.
	 * 
	 * @param {String}
	 *            origin IframePMHubClient's window's origin
	 * @param {String}
	 *            securityToken Security token originally sent by Container
	 * @param {Object}
	 *            tunnelWindow window object reference of tunnel window
	 */
	function PostMessageIframeHubClient(client, params) {
		// check communications protocol ID
		this._checkProtocolID();

		this._client = client;
		this._onSecurityAlert = params.HubClient.onSecurityAlert;
		this._scope = params.HubClient.scope || window;
		this._id = PostMessageIframeHubClient.queryURLParam("oahi");
		this._internalID = PostMessageIframeHubClient.queryURLParam("oahj") || this._id;
		this._securityToken = PostMessageIframeHubClient.queryURLParam("oaht");
		this._tunnelURI = PostMessageIframeHubClient.queryURLParam("oahu");
		this._pmCapabilities = PostMessageIframeHubClient.queryURLParam("oahpm");

		// if any of the URL params are missing, throw WrongProtocol error
		if (!this._id || !this._securityToken || !this._tunnelURI) {
			throw new Error(Errors.WrongProtocol);
		}

		this._partnerOrigin = new RegExp("^([a-zA-Z]+://[^/?#]+).*").exec(this._tunnelURI)[1];
		this._partnerOriginNoPort = new RegExp("^([a-zA-Z]+://[^:]+).*").exec(this._partnerOrigin)[1]; // HW
		// Optimization
		// if "message" event doesn't support "origin" property, then save
		// hostname
		// (domain) also
		if (this._pmCapabilities.indexOf("d") != -1) {
			this._partnerDomain = new RegExp("^.+://([^:]+).*").exec(this._partnerOrigin)[1];
		}

		if (params.HubClient.log) {
			var id = this._id;
			var scope = this._scope;
			var logfunc = params.HubClient.log;
			this._log = function(msg) {
				logfunc.call(scope, "IframeHubClient::" + id + ": " + msg);
			};
			this._doLog = true; // HW Optimization
		}
		else {
			this._log = function() {
			};
		}

		this._connected = false;
		this._subs = {};
		this._subIndex = 1; // HW FIX

		// if postMessage is synchronous, wrap in a setTimeout
		if (this._pmCapabilities.indexOf("s") == -1) {
			this._postMessage = function(win, msg, origin) {
				win.postMessage(msg, origin);
			}
		}
		else {
			this._postMessage = function(win, msg, origin) {
				setTimeout(function() {
					win.postMessage(msg, origin);
				}, 0);
			}
		}
	}

	/** * Helper Functions ** */
	PostMessageIframeHubClient.queryURLParam = function(param) {
		var result = new RegExp("[\\?&]" + param + "=([^&#]*)").exec(window.location.search);
		if (result) {
			return decodeURIComponent(result[1].replace(/\+/g, "%20"));
		}
		return null;
	};

	// communications protocol identifier
	PostMessageIframeHubClient.protocolID = "juk-3.0";

	PostMessageIframeHubClient.prototype = {

		_pmCapabilities : '',

		/** * juk.HubClient interface implementation ** */

		connect : function(onComplete, scope) {
			if (onComplete) {
				this._connectOnComplete = {
					cb : onComplete,
					sc : scope
				};
			}

			// start listening for messages
			this._msgListener = this._receiveMessage.bind(this);
			if (window.addEventListener) {
				window.addEventListener("message", this._msgListener, false);
			}
			else if (window.attachEvent) {
				window.attachEvent("onmessage", this._msgListener);
			}

			// create tunnel iframe, which will finish connection to
			// container
			var origin = window.location.protocol + "//" + window.location.host;
			var iframe = document.createElement("iframe");
			document.body.appendChild(iframe);
			iframe.src = this._tunnelURI + (this._tunnelURI.indexOf("?") == -1 ? "?" : "&") + "oahj=" + encodeURIComponent(this._internalID) + "&oaht=" + this._securityToken + "&oaho=" + encodeURIComponent(origin);
			iframe.style.position = "absolute";
			iframe.style.left = iframe.style.top = "-10px";
			iframe.style.height = iframe.style.width = "1px";
			iframe.style.visibility = "hidden";
			this._tunnelIframe = iframe;
		},

		disconnect : function(onComplete, scope) {
			this._connected = false;
			if (onComplete) {
				this._disconnectOnComplete = {
					cb : onComplete,
					sc : scope
				};
			}
			this._sendMessage("dis", null);
		},

		getPartnerOrigin : function() {
			if (this._connected) {
				// remove port, if it is present
				return new RegExp("^([a-zA-Z]+://[^:]+).*").exec(this._partnerOrigin)[1];
			}
			return null;
		},

		getClientID : function() {
			return this._id;
		},

		/** * juk.Hub interface implementation ** */

		subscribe : function(topic, onData, scope, onComplete, subscriberData) {
			var subID = "" + this._subIndex++;
			this._subs[subID] = {
				cb : onData,
				sc : scope,
				d : subscriberData,
				oc : onComplete
			};
			this._sendMessage("sub", {
				t : topic,
				s : subID
			});
			return subID;
		},

		publish : function(topic, data) {
			this._sendMessage("pub", {
				t : topic,
				d : data
			});
		},

		unsubscribe : function(subID, onComplete, scope) {
			// if no such subID, or in process of unsubscribing given ID,
			// throw error
			if (!this._subs[subID] || this._subs[subID].uns) {
				throw new Error(Errors.NoSubscription);
			}
			this._subs[subID].uns = {
				cb : onComplete,
				sc : scope
			};
			this._sendMessage("uns", {
				s : subID
			});
		},

		isConnected : function() {
			return this._connected;
		},

		getScope : function() {
			return this._scope;
		},

		getSubscriberData : function(subID) {
			var sub = this._subs[subID];
			if (sub) {
				return sub.d;
			}
			throw new Error(Errors.NoSubscription);
		},

		getSubscriberScope : function(subID) {
			var sub = this._subs[subID];
			if (sub) {
				return sub.sc;
			}
			throw new Error(Errors.NoSubscription);
		},

		/** * Private Functions ** */

		_checkProtocolID : function() {
			var partnerProtocolID = PostMessageIframeHubClient.queryURLParam("oahpv");
			if (partnerProtocolID != PostMessageIframeHubClient.protocolID) {
				throw new Error(Errors.WrongProtocol);
			}
		},

		_receiveMessage : function(event) {
			// If the received message isn't JSON parseable or if the
			// resulting
			// object doesn't have the structure we expect, then just
			// return. This
			// message might belong to some other code on the page that is
			// also using
			// postMessage for communication.
			try {
				var msg = JSON.parse(event.data);
			}
			catch (e) {
				return;
			}
			if (!this._verifyMsg(msg)) {
				return;
			}

			// check that security token and window source for incoming
			// message
			// are what we expect
			if (msg.i != this._internalID) {
				// this message might belong to an IframeContainer on this
				// page
				return;
			}
			else if (!PostMessageIframeContainer.originMatches(this, event) || msg.t != this._securityToken) {
				// security error -- incoming message is not valid
				try {
					this._onSecurityAlert.call(this._scope, this._client, SecurityAlerts.ForgedMsg);
				}
				catch (e) {
					this._log("caught error from onSecurityAlert callback to constructor: " + e.message);
				}
				return;
			}

			if (this._doLog) { // HW Optimization
				this._log("received message: [" + event.data + "]");
			}

			switch (msg.m) {
			// subscribe acknowledgement
			case "sub_ack":
				var subID = msg.p.s;
				var onComplete = this._subs[subID].oc;
				if (onComplete) {
					try {
						delete this._subs[subID].oc;
						var scope = this._subs[subID].sc;
						onComplete.call(scope, msg.p.s, msg.p.e == "", msg.p.e);
					}
					catch (e) {
						this._log("caught error from onComplete callback to HubClient.subscribe(): " + e.message);
					}
				}
				break;

			// publish event
			case "pub":
				var subID = msg.p.s;
				// if subscription exists and we are not in process of
				// unsubscribing...
				if (this._subs[subID] && !this._subs[subID].uns) {
					var onData = this._subs[subID].cb;
					var scope = this._subs[subID].sc;
					var subscriberData = this._subs[subID].d;
					try {
						onData.call(scope, msg.p.t, msg.p.d, subscriberData);
					}
					catch (e) {
						this._log("caught error from onData callback to HubClient.subscribe(): " + e.message);
					}
				}
				break;

			// unsubscribe acknowledgement
			case "uns_ack":
				var subID = msg.p;
				if (this._subs[subID]) {
					var onComplete = this._subs[subID].uns.cb;
					if (onComplete) {
						try {
							var scope = this._subs[subID].uns.sc;
							onComplete.call(scope, subID, true);
						}
						catch (e) {
							this._log("caught error from onComplete callback to HubClient.unsubscribe(): " + e.message);
						}
					}
					delete this._subs[subID];
				}
				break;

			// connect acknowledgement
			case "con_ack":
				this._connected = true;
				if (this._connectOnComplete) {
					var onComplete = this._connectOnComplete.cb;
					var scope = this._connectOnComplete.sc;
					try {
						onComplete.call(scope, this._client, true);
					}
					catch (e) {
						this._log("caught error from onComplete callback to HubClient.connect(): " + e.message);
					}
					delete this._connectOnComplete;
				}
				break;

			// disconnect acknowledgment
			case "dis_ack":
				// stop listening for messages
				if (window.removeEventListener) {
					window.removeEventListener("message", this._msgListener, false);
				}
				else {
					window.detachEvent("onmessage", this._msgListener);
				}
				delete this._msgListener;

				this._tunnelIframe.parentNode.removeChild(this._tunnelIframe);
				delete this._tunnelIframe;

				if (this._disconnectOnComplete) {
					try {
						var onComplete = this._disconnectOnComplete.cb;
						var scope = this._disconnectOnComplete.sc;
						onComplete.call(scope, this._client, true);
					}
					catch (e) {
						this._log("caught error from onComplete callback to HubClient.disconnect(): " + e.message);
					}
					delete this._disconnectOnComplete;
				}
				break;
			}
		},

		_verifyMsg : function(msg) {
			return typeof msg.m == "string" && "t" in msg && "p" in msg;
		},

		/**
		 * Send a string message to the associated container.
		 * 
		 * The message is a JSON representation of the following object: { m:
		 * message type, i: client id, t: security token, p: payload (depends on
		 * message type) }
		 * 
		 * The payload for each message type is as follows: TYPE DESCRIPTION
		 * PAYLOAD "con" connect N/A "dis" disconnect N/A "sub" subscribe { t:
		 * topic, s: subscription id } "uns" unsubscribe { s: subscription id }
		 * "pub" publish { t: topic, d: data }
		 */
		_sendMessage : function(type, payload) {
			var msg = JSON.stringify({
				m : type,
				i : this._internalID,
				t : this._securityToken,
				p : payload
			});
			this._postMessage(window.parent, msg, this._partnerOrigin);
		}

	};

	return PostMessageIframeHubClient;

}));