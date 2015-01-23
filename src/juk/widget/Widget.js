(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ './WidgetUtils' ], factory);
	}
	else {
		root.Widget = factory(root.WidgetUtils);
	}
}(this, function(WidgetUtils) {

	'use strict';

	function BaseWidget(spec, hub, id, containerParams) {
		this._spec = spec;
		this._hub = hub;
		this._id = id;
		this._containerParams = this._processContainerParams(containerParams);
	}

	BaseWidget._DEFAULT_CONTAINER_PARAMS = {
		Container : {
			onSecurityAlert : function(source, alertType) {
			}
		}
	};

	BaseWidget.prototype = {

		_spec : null,

		_hub : null,

		_tunnelUri : null,

		_id : null,

		containerParams : null,

		_container : null,

		render : function() {
		},

		destroy : function() {
			this._hub.removeContainer(this._container);
		},

		_processContainerParams : function(containerParams) {
			var params = {};
			_.extend(params.Container, BaseWidget._DEFAULT_CONTAINER_PARAMS);
			_.extend(params.Container, containerParams.Container);
			return params;
		}

	};

	return BaseWidget;

}));