(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else {
		root.Widget = factory();
	}
}(this, function() {

	'use strict';

	var WidgetUtils = {};

	WidgetUtils.prototype = {};

	return WidgetUtils;

}));