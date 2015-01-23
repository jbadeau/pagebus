(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ './MessageFactory', '../Utils' ], factory);
	}
	else {
		root.Widget = factory(root.Utils);
	}
}(this, function(Utils) {

	var DocumentMessageFactory = (function(base) {
		Utils._extends(DocumentMessageFactory, base);

		function DocumentMessageFactory() {
			base.call(this);
		}

		DocumentMessageFactory.prototype.setBody = function() {
			var body = {};
			base.prototype.setBody.call(this, body);
		};

		return DocumentMessageFactory;

	})(MessageFactory)

	return DocumentMessageFactory;

}));