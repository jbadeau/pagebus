(function(requirejs) {
	
	var config = {

		baseUrl : '.',

		paths : {
			bootstrap : '../bower_components/bootstrap/js/bootstrap',
			jquery : '../bower_components/jquery/dist/jquery',
			tv4 : '../bower_components/tv4/tv4'
		},

		packages : [
		    { name : 'juk', location : '../../src/juk' }
		]

	};

    requirejs(config, [ 'iframe' ], bootstrap, fail);

    function bootstrap(Iframe) {
        var config = {};
        new Iframe(config);
    }

	function fail(error) {
		console.error('iframe client failed to start: ' + error);
	}

})(requirejs);