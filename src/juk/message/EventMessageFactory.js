(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ './MessageFactory', '../Utils' ], factory);
	}
	else {
		root.Widget = factory(root.Utils);
	}
}(this, function(Utils) {

	var EventMessageFactory = (function(base) {
		Utils._extends(EventMessageFactory, base);

		function EventMessageFactory() {
			base.call(this);
		}

		EventMessageFactory.prototype.setBody = function() {
			var body = {};
			base.prototype.setBody.call(this, body);
		};

		return EventMessageFactory;

	})(MessageFactory)

	return EventMessageFactory;

}));