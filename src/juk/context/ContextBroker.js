(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else {
		root.ManagedHub = factory();
	}
}(this, function() {

	function ContextBroker() {
	}

	ContextBroker.prototype = {};

	return ContextBroker;

}));