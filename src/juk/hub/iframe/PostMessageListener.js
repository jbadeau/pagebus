(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else if (typeof exports === 'object') {
		module.exports = factory();
	}
	else {
		root.PostMessageListener = factory();
	}
}(this, function() {

	function PostMessageListener() {
		this._containers = {};

		if (window.addEventListener) {
			window.addEventListener("message", this._receiveMessage.bind(this), false);
		}
		else if (window.attachEvent) {
			window.attachEvent("onmessage", this._receiveMessage.bind(this));
		}
	}

	PostMessageListener.prototype = {

		/**
		 * Add an PostMessageIframeContainer to listen for messages. Returns an
		 * ID for the given container that is unique within the PAGE, not just
		 * the ManagedHub instance.
		 */
		addContainer : function(container) {
			var id = container._id;
			while (this._containers[id]) {
				// a client with the specified ID already exists on this
				// page;
				// create a unique ID
				id = ((0x7fff * Math.random()) | 0).toString(16) + "_" + id;
			}

			this._containers[id] = container;
			return id;
		},

		removeContainer : function(internalID) {
			delete this._containers[internalID];
			// XXX TODO If no more postMessage containers, remove listener?
		},

		/**
		 * Complete connection between HubClient and Container identified by
		 * "id". This function is only called by the tunnel window.
		 */
		connectFromTunnel : function(internalID, origin, securityToken, tunnelWindow) {
			if (this._containers[internalID]) {
				this._containers[internalID].connect(origin, securityToken, tunnelWindow);
			}
		},

		_receiveMessage : function(event) {
			// If the received message isn't JSON parseable or if the
			// resulting
			// object doesn't have the structure we expect, then just
			// return.
			try {
				var msg = JSON.parse(event.data);
			}
			catch (e) {
				return;
			}
			if (!this._verifyMsg(msg)) {
				return;
			}

			if (this._containers[msg.i]) {
				var container = this._containers[msg.i].receiveMessage(event, msg);
			}
		},

		_verifyMsg : function(msg) {
			return typeof msg.m == "string" && typeof msg.i == "string" && "t" in msg && "p" in msg;
		}

	};

	return PostMessageListener;

}));