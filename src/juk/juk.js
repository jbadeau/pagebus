(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([

		'./Utils',
		'./hub/Errors',
		'./hub/SecurityAlerts',
		'./hub/ManagedHub',
		'./hub/iframe/Crypto',
		'./hub/iframe/IframeContainer',
		'./hub/iframe/IframeHubClient',
		'./hub/iframe/PostMessageIframeContainer',
		'./hub/iframe/PostMessageListener',
		'./widget/Loader',
		'./widget/MessageFactory',
		'./widget/WidgetUtils',
		'./widget/iframe/IframeWidget',
		'./message/CommandMessageFactory',
		'./message/DocumentMessageFactory',
		'./message/EventMessageFactory',
		'./context/ContextBroker',
		'./context/ContextClient'
		
		], factory);
	}
	else {
		root.juk = factory();
	}
}(this, function(

		Utils,
		Errors,
		SecurityAlerts,
		ManagedHub,
		Crypto,
		IframeContainer,
		IframeHubClient,
		PostMessageIframeContainer,
		PostMessageListener,
		Loader,
		MessageFactory,
		WidgetUtils,
		IframeWidget,
		CommandMessageFactory,
		DocumentMessageFactory,
		EventMessageFactory,
		ContextBroker,
		ContextClient

) {

	'use strict';

	var juk = {};

	juk.Utils = Utils;

	juk.hub = {};
	juk.hub.Errors = Errors;
	juk.hub.SecurityAlerts = SecurityAlerts;
	juk.hub.ManagedHub = ManagedHub;

	juk.hub.iframe = {};
	juk.hub.iframe.Crypto = Crypto;
	juk.hub.iframe.IframeContainer = IframeContainer;
	juk.hub.iframe.IframeHubClient = IframeHubClient;
	juk.hub.iframe.PostMessageIframeContainer = PostMessageIframeContainer;
	juk.hub.iframe.PostMessageIframeHubClient = PostMessageIframeHubClient;
	juk.hub.iframe.PostMessageListener = PostMessageListener;

	juk.widget = {};
	juk.widget.Loader = Loader;
	juk.widget.Widget = Widget;
	juk.widget.WidgetUtils = WidgetUtils;

	juk.widget.iframe = {};
	juk.widget.iframe.IframeWidget = IframeWidget;

	juk.context = {};
	juk.context.ContextBroker = ContextBroker;
	juk.context.ContextClient = ContextClient;

	return juk;

}));