(function(requirejs) {

	var config = {

		baseUrl : '.',

		paths : {
			bootstrap : '../bower_components/bootstrap/js/bootstrap',
			jquery : '../bower_components/jquery/dist/jquery',
			lodash : '../bower_components/lodash/lodash',
			sprintf : '../bower_components/sprintf/src/sprintf',
			tv4 : '../bower_components/tv4/tv4'
		},

		packages : [
		    { name : 'juk', location : '../src/juk' }
		],
		
		shim : {
			'bootstrap' : { deps : [ 'jquery' ] }
		}

	};

	requirejs(config, [ 'hub' ], success, fail);

	function success() {
		console.error('hub client failed to boot: ' + error);
	}

	function fail(error) {
		console.error('hub client failed to start: ' + error);
	}

})(requirejs);