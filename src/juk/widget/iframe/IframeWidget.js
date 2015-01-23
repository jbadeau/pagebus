(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'lodash', '../Widget', '../../Utils', '../../hub/iframe/IframeContainer' ], factory);
	}
	else {
		root.IframeWidget = factory(root._, root.Widget, root.Utils, root.IframeContainer);
	}
}(this, function(_, Widget, Utils, IframeContainer) {

	'use strict';

	var IframeWidget = (function(base) {

		Utils._extends(IframeWidget, base);

		function IframeWidget(spec, hub, id, containerParams) {
			base.call(this, spec, hub, id, containerParams);
		}

		IframeWidget._DEFAULT_IFRAME_CONTAINER_PARAMS = {
			Container : {
				onSecurityAlert : function(source, alertType) {
				}
			},
			IframeContainer : {
				iframeAttrs : {
					scrolling : 'no',
					frameborder : '0',
					style : {
						border : '0'
					}
				},
			}
		};

		IframeWidget.prototype = {

			render : function() {
				var containerParams = _.cloneDeep(IframeWidget._DEFAULT_CONTAINER_PARAMS);
				_.assign(containerParams, this._id, containerParams);
				this._container = new IframeContainer(this._hub, this._id, this._containerParams);
			},

			_processContainerParams : function(containerParams) {
				var params = base.prototype._processContainerParams.call(this, containerParams);
				_.extend(params, IframeWidget._DEFAULT_IFRAME_CONTAINER_PARAMS);
				_.extend(params.IframeContainer, containerParams.IframeContainer);
				params.IframeContainer.uri = this._spec.content.src;
				return params;
			}

		};

		return IframeWidget;

	})(Widget)

	return IframeWidget;

}));