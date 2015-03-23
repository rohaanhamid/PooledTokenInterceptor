# About the module

*pooledtokeninterceptor* is a NodeJS module that uses a pool of tokens to access API endpoints thereby increasing the number of requests that can be made at a given time from the imposed limits. The module works by assigning access tokens to each request in a round robin pattern and returns a promise. The module then checks the response and resolves the promise based on the type of call made.

The following types of calls are allowed:

1) 'WTC' or Wait to Complete - This type of call checks the response code to determine if the limit has been exceeded. It then waits for the rate limit to be reset, makes another requests and resolves the promise on success.

2) 'FOK' or Fill or Kill - This type of call simply distributes tokens from the supplied pool to requests to maximize the number of successful requests that can be made. All failed responses are returned as it is. 

# How to use

Get the module and Q from *npm*:
```
npm install pooledtokeninterceptor
npm install q
```
Q is used to process the promises.

Add the module and Q:
```javascript
var interceptorModule = require('pooledtokeninterceptor');
var Q = require('q');

```

Setup a configuration object for the token pool:

```javascript
var tokenConfig = {
	tokenLocation : 'header', //or 'query'. This tells the module if the token should be added in the header or as a query param
	tokenIdentifier : 'Token', // Sets up the identifier for the token in the header (e.g "Token 32903209499324") or query param "&access_token=99348384838834834".
	tokens : ['token1', 'token2'], // As many as you like.
	failureResponseCode : 403, // Default to 403. This is used by the module to check if the request failed. Check what the API being used with sends back when rate limit is exhausted.
	headerLimitResetVar	: 'x-ratelimit-reset' // Key name in the response header for the variable that holds then time for the limit to be reset. It is x-ratelimit-reset for Github.
};
```

Initialize it and make a request:

```javascript

var options = {
	url: 'https://api.github.com/search/repositories?q=Material+language:Java&sort=stars&order=desc',
	headers: {
		'User-Agent': 'request' //A User-Agent header is required my most APIs
	}
}

var interceptor = interceptorModule(tokenConfig);
Q.fcall(interceptor.authenticatedRequest(options, 'FOK'))
  .then(console.log); //Log the response as an example. FOK assigns a token from the pool and returns the response 

```

The module is built on <a href=https://www.npmjs.com/package/request>Request</a> so other fancier *options* can also be used based on what it accepts.

The module can also be used to make multiple requests as follows:

```javascript

var promisesArray = [];

// Collect promises for each of the requests to the API
for(var i = 0; i < 45; i++){
	promisesArray.push(request.authenticatedRequest(options, 'WTC'));
}

// Wait for the promised to resolve and print out the statusCode for each of them
Q.all(promisesArray).then(function(responses){
	console.log("Number of responses: " + responses.length);
	for(var i = 0; i < responses.length; i++){
		console.log(responses[i].statusCode);
	}
})

```

The above example will make 45 requests to the github api. If one token is supplied only 30 requests can ideally be made till the limit is exceeded. With the 'WTC' option, the module will collect the 15 failed responses, wait for the limits to be reset and retry the requests for each of them. Promises are only resolved when all the requests have been successfully made. 

