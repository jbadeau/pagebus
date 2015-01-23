define([ 'juk/hub/iframe/IframeHubClient' ], function(IframeHubClient) {

	return function Iframe(config) {

		var onSecurityAlert = function(source, alertType) {
		};

		var params = {
			HubClient : {
				onSecurityAlert : onSecurityAlert
			}
		};

		var hubClient = new IframeHubClient(params);

		hubClient.connect().then(function() {
			console.info(hubClient.getClientID() + ' connected');
			hubClient.publish('juk.client.id', {
				"clientId" : hubClient.getClientID()
			});
			console.info(hubClient.getClientID() + ' published');
			return hubClient.subscribe('test', function() {
			});
		}).then(function(subscription) {
			console.info(hubClient.getClientID() + ' subscribed');
			return hubClient.unsubscribe(subscription);
		}).then(function() {
			console.info(hubClient.getClientID() + ' unsubscribed');
		}, function(error) {
			console.error(error);
		});

	}

});