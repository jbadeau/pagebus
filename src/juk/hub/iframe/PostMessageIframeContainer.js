(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../SecurityAlerts', './PostMessageListener', './Crypto' ], factory);
	}
	else {
		root.PostMessageIframeContainer = factory(root.SecurityAlerts, root.PostMessageListener, root.Crypto);
	}
}(this, function(SecurityAlerts, PostMessageListener, Crypto) {

	/***************************************************************************
	 * PostMessage Iframe Container
	 * 
	 * Implementation of the Iframe Container which uses window.postMessage()
	 * for communicating between an iframe and its parent.
	 **************************************************************************/
	function PostMessageIframeContainer(container, hub, clientID, params) {
		this._container = container;
		this._hub = hub;
		this._id = clientID;
		this._onSecurityAlert = params.Container.onSecurityAlert;
		this._onConnect = params.Container.onConnect ? params.Container.onConnect : null;
		this._onDisconnect = params.Container.onDisconnect ? params.Container.onDisconnect : null;
		this._scope = params.Container.scope || window;
		this._uri = params.IframeContainer.uri;
		this._tunnelURI = params.IframeContainer.tunnelURI;
		this._timeout = params.IframeContainer.timeout || 15000;

		if (params.Container.log) {
			var scope = this._scope;
			var logfunc = params.Container.log;
			this._log = function(msg) {
				logfunc.call(scope, "IframeContainer::" + clientID + ": " + msg);
			};
			this._doLog = true; // HW Optimization
		}
		else {
			this._log = function() {
			};
		}

		this._securityToken = this._generateSecurityToken(params);

		this._connected = false;
		this._subs = {};

		// test if the postMessage impl of this browser is synchronous
		if (this._pmCapabilities === null) {
			this._testPostMessage();
		}

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

		// register this container with the singleton message listener
		if (PostMessageIframeContainer._pmListener == null) {
			PostMessageIframeContainer._pmListener = new PostMessageListener();
		}
		// the 'internal ID' is guaranteed to be unique within the page, not
		// just
		// the ManagedHub instance
		this._internalID = PostMessageIframeContainer._pmListener.addContainer(this);

		this._startLoadTimer();
	}

	// communications protocol identifier
	PostMessageIframeContainer.protocolID = "juk-3.0";

	PostMessageIframeContainer._pmListener = null;

	/** * Helper Functions ** */

	PostMessageIframeContainer.originMatches = function(obj, event) {
		if (event.origin) {
			return event.origin == obj._partnerOrigin;
		}
		else {
			return event.domain == obj._partnerDomain;
		}
	};

	PostMessageIframeContainer.prototype = {

		_pmCapabilities : "",

		// Singleton message listener
		_pmListener : null,

		_prng : null,

		getHub : function() {
			return this._hub;
		},

		sendToClient : function(topic, data, subscriptionID) {
			this._sendMessage("pub", {
				t : topic,
				d : data,
				s : subscriptionID
			});
		},

		remove : function() {
			this._disconnect();
			PostMessageIframeContainer._pmListener.removeContainer(this._internalID);
			clearTimeout(this._loadTimer);
		},

		isConnected : function() {
			return this._connected;
		},

		getPartnerOrigin : function() {
			if (this._connected) {
				// remove port, if it is present
				// HW Optimization
				return this._partnerOriginNoPort;
				// return new RegExp( "^([a-zA-Z]+://[^:]+).*" ).exec(
				// this._partnerOrigin )[1];
			}
			return null;
		},

		receiveMessage : function(event, msg) {
			// check that security token and client window origin for
			// incoming message
			// are what we expect
			if (msg.t != this._securityToken || (typeof this._partnerOrigin != "undefined" && !PostMessageIframeContainer.originMatches(this, event))) {
				// security error -- incoming message is not valid; ignore
				this._invokeSecurityAlert(SecurityAlerts.ForgedMsg);
				return;
			}

			if (this._doLog) { // HW Optimization
				this._log("received message: [" + event.data + "]");
			}

			switch (msg.m) {
			// subscribe
			case "sub":
				var errCode = ""; // empty string is success
				try {
					this._subs[msg.p.s] = this._hub.subscribeForClient(this._container, msg.p.t, msg.p.s);
				}
				catch (e) {
					errCode = e.message;
				}
				this._sendMessage("sub_ack", {
					s : msg.p.s,
					e : errCode
				});
				break;

			// publish
			case "pub":
				this._hub.publishForClient(this._container, msg.p.t, msg.p.d);
				break;

			// unsubscribe
			case "uns":
				var handle = this._subs[msg.p.s];
				this._hub.unsubscribeForClient(this._container, handle);
				delete this._subs[msg.p.s];
				this._sendMessage("uns_ack", msg.p.s);
				break;

			// connect is handled elsewhere -- see
			// PostMessageIframeContainer.prototype.connect

			// disconnect
			case "dis":
				this._startLoadTimer();
				this._disconnect();
				this._sendMessage("dis_ack", null);
				if (this._onDisconnect) {
					try {
						this._onDisconnect.call(this._scope, this._container);
					}
					catch (e) {
						this._log("caught error from onDisconnect callback to constructor: " + e.message);
					}
				}
				break;
			}
		},

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
		connect : function(origin, securityToken, tunnelWindow) {
			this._log("client connecting to container " + this._id + " :: origin = " + origin + " :: securityToken = " + securityToken);

			// check that security token is what we expect
			if (securityToken != this._securityToken) {
				// security error -- incoming message is not valid
				this._invokeSecurityAlert(SecurityAlerts.ForgedMsg);
				return;
			}

			// set unload handler on tunnel window
			var that = this;
			tunnelWindow.onunload = function() {
				if (that.isConnected()) {
					// Use a timer to delay the phishing message. This makes
					// sure that
					// page navigation does not cause phishing errors.
					// Setting it to 1 ms is enough for it not to be
					// triggered on
					// regular page navigations.
					setTimeout(function() {
						that._invokeSecurityAlert(SecurityAlerts.FramePhish);
					}, 1);
				}
			};

			clearTimeout(this._loadTimer);

			this._iframe = this._container.getIframe();
			this._iframe.style.visibility = "visible";

			this._partnerOrigin = origin;
			// HW Optimization
			this._partnerOriginNoPort = new RegExp("^([a-zA-Z]+://[^:]+).*").exec(this._partnerOrigin)[1]; // HW
			// Optimization
			// if "message" event doesn't support "origin" property, then
			// save hostname
			// (domain) also
			if (this._pmCapabilities.indexOf("d") != -1) {
				this._partnerDomain = new RegExp("^.+://([^:]+).*").exec(this._partnerOrigin)[1];
			}

			this._sendMessage("con_ack", null);
			this._connected = true;
			if (this._onConnect) {
				try {
					this._onConnect.call(this._scope, this._container);
				}
				catch (e) {
					this._log("caught error from onConnect callback to constructor: " + e.message);
				}
			}
		},

		getURI : function() {
			// add the client ID and a security token as URL query params
			// when loading
			// the client iframe
			var paramStr = "oahpv=" + encodeURIComponent(PostMessageIframeContainer.protocolID) + "&oahi=" + encodeURIComponent(this._internalID) + "&oaht=" + this._securityToken + "&oahu=" + encodeURIComponent(this._tunnelURI) + "&oahpm=" + this._pmCapabilities;
			if (this._id !== this._internalID) {
				paramStr += "&oahj=" + this._internalID;
			}

			var parts = this._uri.split("#");
			parts[0] = parts[0] + ((parts[0].indexOf("?") != -1) ? "&" : "?") + paramStr;
			if (parts.length == 1) {
				return parts[0];
			}
			return parts[0] + "#" + parts[1];
		},

		/** * Private Function ** */

		_generateSecurityToken : function(params) {
			if (this._prng === null) {
				// create pseudo-random number generator with a default seed
				var seed = new Date().getTime() + Math.random() + document.cookie;
				this._prng = Crypto.newPRNG(seed);
			}

			if (params.IframeContainer.seed) {
				try {
					var extraSeed = params.IframeContainer.seed.call(this._scope);
					this._prng.addSeed(extraSeed);
				}
				catch (e) {
					this._log("caught error from 'seed' callback: " + e.message);
				}
			}

			var tokenLength = params.IframeContainer.tokenLength || 6;
			return this._prng.nextRandomB64Str(tokenLength);
		},

		/**
		 * Some browsers (IE, Opera) have an implementation of postMessage that
		 * is synchronous, although HTML5 specifies that it should be
		 * asynchronous. In order to make all browsers behave consistently, we
		 * run a small test to detect if postMessage is asynchronous or not. If
		 * not, we wrap calls to postMessage in a setTimeout with a timeout of
		 * 0. Also, Opera's "message" event does not have an "origin" property
		 * (at least, it doesn't in version 9.64; presumably, it will in version
		 * 10). If event.origin does not exist, use event.domain. The other
		 * difference is that while event.origin looks like <scheme>://<hostname>:<port>,
		 * event.domain consists only of <hostname>.
		 */
		_testPostMessage : function() {
			// String identifier that specifies whether this browser's
			// postMessage
			// implementation differs from the spec:
			// contains "s" - postMessage is synchronous
			// contains "d" - "message" event does not have an "origin"
			// property;
			// the code looks for the "domain" property instead
			this._pmCapabilities = "";

			var hit = false;

			function receiveMsg(event) {
				if (event.data == "postmessage.test") {
					hit = true;
					if (typeof event.origin === "undefined") {
						this._pmCapabilities += "d";
					}
				}
			}

			if (window.addEventListener) {
				window.addEventListener("message", receiveMsg, false);
			}
			else if (window.attachEvent) {
				window.attachEvent("onmessage", receiveMsg);
			}
			window.postMessage("postmessage.test", "*");

			// if 'hit' is true here, then postMessage is synchronous
			if (hit) {
				this._pmCapabilities += "s";
			}

			if (window.removeEventListener) {
				window.removeEventListener("message", receiveMsg, false);
			}
			else {
				window.detachEvent("onmessage", receiveMsg);
			}
		},

		_startLoadTimer : function() {
			var that = this;
			this._loadTimer = setTimeout(function() {
				// don't accept any messages from client
				PostMessageIframeContainer._pmListener.removeContainer(that._internalID);
				// alert the security alert callback
				that._invokeSecurityAlert(SecurityAlerts.LoadTimeout);
			}, this._timeout);
		},

		/**
		 * Send a string message to the associated hub client.
		 * 
		 * The message is a JSON representation of the following object: { m:
		 * message type, i: client id, t: security token, p: payload (depends on
		 * message type) }
		 * 
		 * The payload for each message type is as follows: TYPE DESCRIPTION
		 * PAYLOAD "con_ack" connect acknowledgment N/A "dis_ack" disconnect
		 * acknowledgment N/A "sub_ack" subscribe acknowledgment { s:
		 * subscription id, e: error code (empty string if no error) } "uns_ack"
		 * unsubscribe acknowledgment { s: subscription id } "pub" publish (i.e.
		 * sendToClient()) { t: topic, d: data, s: subscription id }
		 */
		_sendMessage : function(type, payload) {
			var msg = JSON.stringify({
				m : type,
				i : this._internalID,
				t : this._securityToken,
				p : payload
			});
			this._postMessage(this._iframe.contentWindow, msg, this._partnerOrigin);
		},

		_disconnect : function() {
			if (this._connected) {
				this._connected = false;
				this._iframe.style.visibility = "hidden";

				// unsubscribe from all subs
				for ( var sub in this._subs) {
					this._hub.unsubscribeForClient(this._container, this._subs[sub]);
				}
				this._subs = {};
			}
		},

		_invokeSecurityAlert : function(errorMsg) {
			try {
				this._onSecurityAlerts.call(this._scope, this._container, errorMsg);
			}
			catch (e) {
				this._log("caught error from onSecurityAlert callback to constructor: " + e.message);
			}
		}

	};

	// required by tunnel.html
	window.PostMessageIframeContainer = PostMessageIframeContainer;
	
	return PostMessageIframeContainer;

}));