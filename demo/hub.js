(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'juk/widget/Loader', 'juk/hub/ManagedHub', 'juk/hub/iframe/IframeContainer' ], factory);
	}
	else {
		factory(root.Loader, root.ManagedHub, root.IframeContainer);
	}
}(this, function(Loader, ManagedHub, IframeContainer) {

	var tunnelUri = 'http://localhost:8080/src/juk/hub/iframe/tunnel.html';

	/*
	 * -------------------------------------------------------------------------
	 * LOADER
	 * -------------------------------------------------------------------------
	 */
	var hubParams = {
		onSecurityAlert : function(source, alertType) {
			console.log("onSecurityAlert: s=" + source.getClientID() + " a=" + alertType);
		}
	};

	var loader = new Loader(tunnelUri, hubParams);

	var log = document.getElementById('log');

	loader.getHub().subscribe('**', function() {
		log.value = log.value + JSON.stringify(arguments) + '\n';
	})

	/*
	 * -------------------------------------------------------------------------
	 * WIDGETS
	 * -------------------------------------------------------------------------
	 */
	var widgetSpecUri = 'http://localhost:8080/demo/iframe/widget.json';

	// WIDGET 1
	loader.createWidget('iframe1', widgetSpecUri, {
		IframeContainer : {
			parent : document.getElementById('iframe1')
		}
	}).then(function(widget) {
		widget.render();
	});

	// WIDGET 2
	loader.createWidget('iframe2', widgetSpecUri, {
		IframeContainer : {
			parent : document.getElementById('iframe2')
		}
	}).then(function(widget) {
		widget.render();
	});

	// WIDGET 3
	loader.createWidget('iframe3', widgetSpecUri, {
		IframeContainer : {
			parent : document.getElementById('iframe3')
		}
	}).then(function(widget) {
		widget.render();
	});

}));
