(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'lodash', 'jquery', './iframe/IframeWidget', '../hub/ManagedHub' ], factory);
	}
	else {
		root.WidgetLoader = factory(root._, root.jquery, root.IframeWidget, root.ManagedHub);
	}
}(this, function(_, $, IframeWidget, ManagedHub) {

	function Loader(tunnelUri, hubParams) {
		this._hub = new ManagedHub(this._processHubParams(hubParams));
		this._tunnelUri = tunnelUri;
		this._widgets = {};
	}

	Loader._DEFAULT_HUB_PARAMS = {
		onPublish : function(topic, container) {
			return true;
		},
		onSubscribe : function(topic, container) {
			return true;
		},
		onUnsubscribe : function(topic, container) {
			return true;
		},
		onSecurityAlert : function(source, alertType) {
		},
		scope : this
	};

	Loader.prototype = {

		_hub : null,

		_tunnelUri : null,

		_widgets : null,

		getHub : function(widgetId) {
			return this._hub;
		},

		createWidget : function(id, specUri, containerParams) {
			return $.ajax({
				url : specUri
			}).then(function(spec) {
				return this._processSpec(spec, id, specUri);
			}.bind(this)).then(function(spec) {
				if (!containerParams.IframeContainer.tunnelURI) {
					containerParams.IframeContainer.tunnelURI = this._tunnelUri;
				}
				return new IframeWidget(spec, this._hub, id, containerParams);
			}.bind(this)).then(function(widget) {
				this._widgets[id] = widget;
				return widget;
			}.bind(this));
		},

		destroyWidget : function(widgetId) {
			this._widgets[widgetId].destroy();
		},

		_processHubParams : function(hubParams) {
			var clone = _.cloneDeep(Loader._DEFAULT_HUB_PARAMS);
			// both lodash and jquery cannot recursively extend objects
			_.extend(clone.Container, hubParams);
			return clone;
		},

		_processSpec : function(spec, widgetId, specUri) {
			spec.content.src = specUri.substring(0, specUri.lastIndexOf('widget.json')) + spec.content.src
			return spec;
		}

	};

	return Loader;

}));