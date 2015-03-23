var PooledTokenInterceptor = require("./index"); 
var Q = require("q");

var options = {
	url: 'https://api.github.com/search/repositories?q=Material+language:Java&sort=stars&order=desc',
	headers: {
		'User-Agent': 'request'
	}
}

var tokenConfig = {
	tokenLocation : 'header', //or 'query' 
	tokenIdentifier : 'Token', // or whatever the API requires.
	tokens : [INSERT TOKENS HERE],
	failureResponseCode : 403, // Default to 403. This is used by the module to check if the request failed. Check what the API being used with send back.
	headerLimitResetVar	: 'x-ratelimit-reset' // Paramter name in the response header that holds then time when the limit will be reset
};

var request = new PooledTokenInterceptor(tokenConfig);

var promisesArray = [];

// Collect promised for each of the requests to the API
for(var i = 0; i < 45; i++){
	promisesArray.push(request.authenticatedRequest(options, ''));
}

// Wait for the promised to resolve and print out the statusCode for each of them
Q.all(promisesArray).then(function(responses){
	console.log("Number of responses: " + responses.length);
	for(var i = 0; i < responses.length; i++){
		console.log(responses[i].statusCode);
	}
})
