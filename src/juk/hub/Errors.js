(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'require' ], factory);
	}
	else {
		root.ManagedHub = factory(root.require);
	}
}(this, function(require) {

	var Error = {

		/**
		 * Either a required argument is missing or an invalid argument was
		 * provided.
		 */
		BadParameters : "Error.BadParameters",

		/**
		 * The specified hub has been disconnected and cannot perform the
		 * requested operation.
		 */
		Disconnected : "Error.Disconnected",

		/**
		 * Container with specified ID already exists.
		 */
		Duplicate : "Duplicate container: ",

		/**
		 * The specified ManagedHub has no such Container (or it has been
		 * removed).
		 */
		NoContainer : "Error.NoContainer",

		/**
		 * The specified ManagedHub or Container has no such subscription.
		 */
		NoSubscription : "Error.NoSubscription",

		/**
		 * Permission denied by manager's security policy.
		 */
		NotAllowed : "Error.NotAllowed",

		/**
		 * Wrong communications protocol identifier provided by Container or
		 * HubClient.
		 */
		WrongProtocol : "Error.WrongProtocol",

		/**
		 * The current useragent or browser is not supported.
		 */
		UnsupportedUserAgent : "ErrorUnsupportedUserAgent"
	}

	return Error;

}));