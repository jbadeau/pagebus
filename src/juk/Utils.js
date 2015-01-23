(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else {
		root.Widget = factory();
	}
}(this, function() {

	'use strict';

	var Utils = {};

	Utils._guid = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = (c === "x" ? r : (r & 0x3 | 0x8));
			return v.toString(16);
		});
	};

	Utils._extends = function(base, clazz) {
		for ( var prop in clazz) {
			if (clazz.hasOwnProperty(prop)) {
				base[prop] = clazz[prop];
			}
		}
		function _constructor() {
			this.constructor = base;
		}
		_constructor.prototype = clazz.prototype;
		base.prototype = new _constructor();
	};

	return Utils;

}));