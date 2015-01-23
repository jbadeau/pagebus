(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../Errors', './PostMessageIframeContainer' ], factory);
	}
	else {
		root.ManagedHub = factory(root.Errors, root.PostMessageIframeContainer);
	}
}(this, function(Errors, PostMessageIframeContainer) {

	/**
	 * Create a new Iframe Container.
	 * 
	 * @constructor
	 * @extends juk.Container
	 * 
	 * IframeContainer implements the Container interface to provide a container
	 * that isolates client components into secure sandboxes by leveraging the
	 * isolation features provided by browser iframes.
	 * 
	 * @param {juk.ManagedHub}
	 *            hub Managed Hub instance to which this Container belongs
	 * @param {String}
	 *            clientID A string ID that identifies a particular client of a
	 *            Managed Hub. Unique within the context of the ManagedHub.
	 * @param {Object}
	 *            params Parameters used to instantiate the IframeContainer.
	 *            Once the constructor is called, the params object belongs
	 *            exclusively to the IframeContainer. The caller MUST not modify
	 *            it. The following are the pre-defined properties on params:
	 * @param {Function}
	 *            params.Container.onSecurityAlert Called when an attempted
	 *            security breach is thwarted. Function is defined as follows:
	 *            function(container, securityAlert)
	 * @param {Function}
	 *            [params.Container.onConnect] Called when the client connects
	 *            to the Managed Hub. Function is defined as follows:
	 *            function(container)
	 * @param {Function}
	 *            [params.Container.onDisconnect] Called when the client
	 *            disconnects from the Managed Hub. Function is defined as
	 *            follows: function(container)
	 * @param {Object}
	 *            [params.Container.scope] Whenever one of the Container's
	 *            callback functions is called, references to "this" in the
	 *            callback will refer to the scope object. If no scope is
	 *            provided, default is window.
	 * @param {Function}
	 *            [params.Container.log] Optional logger function. Would be used
	 *            to log to console.log or equivalent.
	 * @param {Object}
	 *            params.IframeContainer.parent Element ID of DOM element that
	 *            is to be parent of iframe
	 * @param {String}
	 *            params.IframeContainer.uri Initial Iframe URI (Container will
	 *            add parameters to this URI)
	 * @param {String}
	 *            params.IframeContainer.tunnelURI URI of the tunnel iframe.
	 *            Must be from the same origin as the page which instantiates
	 *            the IframeContainer.
	 * @param {Object}
	 *            [params.IframeContainer.iframeAttrs] Attributes to add to
	 *            IFRAME DOM entity. For example: { style: { width: "100%",
	 *            height: "100%" }, className: "some_class" }
	 * @param {Number}
	 *            [params.IframeContainer.timeout] Load timeout in milliseconds.
	 *            If not specified, defaults to 15000. If the client at
	 *            params.IframeContainer.uri does not establish a connection
	 *            with this container in the given time, the onSecurityAlert
	 *            callback is called with a LoadTimeout error code.
	 * @param {Function}
	 *            [params.IframeContainer.seed] A function that returns a string
	 *            that will be used to seed the pseudo-random number generator,
	 *            which is used to create the security tokens. An implementation
	 *            of IframeContainer may choose to ignore this value.
	 * @param {Number}
	 *            [params.IframeContainer.tokenLength] Length of the security
	 *            tokens used when transmitting messages. If not specified,
	 *            defaults to 6. An implementation of IframeContainer may choose
	 *            to ignore this value.
	 * 
	 * @throws {Error.BadParameters}
	 *             if required params are not present or null
	 * @throws {Error.Duplicate}
	 *             if a Container with this clientID already exists in the given
	 *             Managed Hub
	 * @throws {Error.Disconnected}
	 *             if hub is not connected
	 */
	function IframeContainer(hub, clientID, params) {
		if (!hub || !clientID || !params || !params.Container || !params.Container.onSecurityAlert || !params.IframeContainer || !params.IframeContainer.parent || !params.IframeContainer.uri || !params.IframeContainer.tunnelURI) {
			throw new Error(Errors.BadParameters);
		}

		this._params = params;
		this._id = clientID;

		if (window.postMessage) {
			this._delegate = new PostMessageIframeContainer(this, hub, clientID, params);
		}
		else {
			throw new Error(Errors.UnsupportedUserAgent);
		}

		// Create IFRAME to hold the client
		this._iframe = this._createIframe(params.IframeContainer.parent, this._delegate.getURI(), params.IframeContainer.iframeAttrs);

		hub.addContainer(this);
	}

	IframeContainer.prototype = {

		/** * juk.Container interface implementation ** */

		getHub : function() {
			return this._delegate.getHub();
		},

		sendToClient : function(topic, data, subscriptionID) {
			this._delegate.sendToClient(topic, data, subscriptionID);
		},

		remove : function() {
			this._delegate.remove();
			this._iframe.parentNode.removeChild(this._iframe);
		},

		isConnected : function() {
			return this._delegate.isConnected();
		},

		getClientID : function() {
			return this._id;
		},

		getPartnerOrigin : function() {
			return this._delegate.getPartnerOrigin();
		},

		getParameters : function() {
			return this._params;
		},

		/**
		 * Get the iframe associated with this iframe container
		 * 
		 * This function returns the iframe associated with an IframeContainer,
		 * allowing the Manager Application to change its size, styles,
		 * scrollbars, etc.
		 * 
		 * CAUTION: The iframe is owned exclusively by the IframeContainer. The
		 * Manager Application MUST NOT destroy the iframe directly. Also, if
		 * the iframe is hidden and disconnected, the Manager Application SHOULD
		 * NOT attempt to make it visible. The Container SHOULD automatically
		 * hide the iframe when it is disconnected; to make it visible would
		 * introduce security risks.
		 * 
		 * @returns iframeElement
		 * @type {Object}
		 */
		getIframe : function() {
			return this._iframe;
		},

		/** * Helper Functions ** */

		/**
		 * Return function that runs in given scope.
		 * 
		 * @param {Object}
		 *            toWhom scope in which to run given function
		 * @param {Function}
		 *            callback function to run in given scope
		 * @returns {Function}
		 */
		bind : function(toWhom, callback) {
			var __method = callback;
			return function() {
				return __method.apply(toWhom, arguments);
			}
		},

		/** * Private Functions ** */

		_createIframe : function(parent, src, attrs) {
			var iframe = document.createElement("iframe");

			// Add iframe attributes
			if (attrs) {
				for ( var attr in attrs) {
					if (attr == "style") {
						for ( var style in attrs.style) {
							iframe.style[style] = attrs.style[style];
						}
					}
					else {
						iframe[attr] = attrs[attr];
					}
				}
			}

			// initially hide IFRAME content, in order to lessen frame
			// phishing impact
			iframe.style.visibility = "hidden";

			// (1) Setting the iframe src after it has been added to the DOM
			// can cause
			// problems in IE6/7. Specifically, if the code is being
			// executed on a page
			// that was served through HTTPS, then IE6/7 will see an iframe
			// with a blank
			// src as a non-secure item and display a dialog warning the
			// user that "this
			// page contains both secure and nonsecure items." To prevent
			// that, we
			// first set the src to a dummy value, then add the iframe to
			// the DOM, then
			// set the real src value.
			// (2) Trying to fix the above issue by setting the real src
			// before adding
			// the iframe to the DOM breaks Firefox 3.x. For some reason,
			// when
			// reloading a page that has instantiated an IframeContainer,
			// Firefox will
			// load a previously cached version of the iframe content, whose
			// source
			// contains stale URL query params or hash. This results in
			// errors in the
			// Hub code, which is expected different values.
			iframe.src = 'javascript:"<html></html>"';
			parent.appendChild(iframe);
			iframe.src = src;

			return iframe;
		}

	};

	return IframeContainer;

}));