(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ './MessageFactory', '../Utils' ], factory);
	}
	else {
		root.Widget = factory(root.Utils);
	}
}(this, function(Utils) {

	var CommandMessageFactory = (function(base) {
		Utils._extends(CommandMessageFactory, base);

		function CommandMessageFactory() {
			base.call(this);
		}

		CommandMessageFactory.prototype.setBody = function() {
			var body = {};
			base.prototype.setBody.call(this, body);
		};

		return CommandMessageFactory;

	})(MessageFactory)

	return CommandMessageFactory;

}));