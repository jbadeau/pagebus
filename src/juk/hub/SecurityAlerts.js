(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'require' ], factory);
	}
	else {
		root.ManagedHub = factory(root.require);
	}
}(this, function(require) {

	var SecurityAlert = {

		/**
		 * Container did not load (possible frame phishing attack).
		 */
		LoadTimeout : "SecurityAlert.LoadTimeout",

		/**
		 * Hub suspects a frame phishing attack against the specified container.
		 */
		FramePhish : "SecurityAlert.FramePhish",

		/**
		 * Hub detected a message forgery that purports to come to a specifed
		 * container.
		 */
		ForgedMsg : "SecurityAlert.ForgedMsg"

	}

	return SecurityAlert;

}));