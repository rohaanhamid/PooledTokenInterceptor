//Return a Request object
//Allow an interceptor to be setup with a specific for a specific website
//Block on a promise or have option to ignore requests after token limit exhausted

var TOKENPOOLCONFIG = {
	'tokenLocation' : 'header', //or query 
	'tokenParam' : 'access_token',  //etc
	'tokens' : [],
	'limitCheckPath' : '/rate_limit',
	'baseUrl' : 'baseUrl',
	'endpoints' : [],
	//'headerLimitRemainingVar' : 0,
	//'headerLimitResetVar'	: 0
};

var resource_pool = {
	search: [
		{
			'token' : '6f7c88588ebe3a853242ccd1f989e1814ada444b',
			'reset' : -1,
			'remaining' : -1
		},
		{

		}
	]
};


var Request = require('request');
var Q = require('q');
var ValidUrl = require('valid-url');

var TokenPoolRequest = function(tokenPoolConfig) {
	var self = this;
	self.Request = Request;
	self.tokenPoolConfig = tokenPoolConfig;

	if(tokenPoolConfig.tokens.length == 0){
		throw new Error("No tokens found");
	}

	self.tokenPoolConfig['currToken'] = 0;

	if(self.tokenPoolConfig['resetOffset'] == null){
		self.tokenPoolConfig['resetOffset'] = 5; //Set a default to 5 sec
	}
	self.tokenLimitInfo = null;
	self.tokenLimitInfoRecipe = null;
	self.resourcePool = null;
};

TokenPoolRequest.prototype.generateResourcePool = function(tokenPoolConfig){
	var self = this;
	var resourcePool = {};
	var endpoints = tokenPoolConfig.endpoints;
	var tokens = tokenPoolConfig.tokens;
	for(var i in endpoints){
		resourcePool[endpoints[i]] = [];
		for(var j in tokens){
			resourcePool[endpoints[i]].push( {
				'token' : tokens[j],
				'reset' : -1,
				'remaining' : -1
			});
		}
	}
	self.resourcePool = resourcePool;
}

TokenPoolRequest.prototype.setTokenPoolConfig = function(tokenPoolConfig){
	var self = this;
	self.tokenPoolConfig = tokenPoolConfig;
};

TokenPoolRequest.prototype.setTokenLimitInfoRecipe = function(tokenLimitInfoRecipe){
	var self = this;
	self.tokenLimitInfoRecipe = tokenLimitInfoRecipe;
};

TokenPoolRequest.prototype.getTokenPoolConfig = function(){
	var self = this;
	return self.tokenPoolConfig;
};

TokenPoolRequest.prototype.getTokenFromPool = function(){
	var self = this;
	var i =  self.tokenPoolConfig.currToken;
	if(i == (self.tokenPoolConfig.tokens.length - 1)){
		self.tokenPoolConfig.currToken = 0;
	}else{
		self.tokenPoolConfig.currToken++; 
	}
	return self.tokenPoolConfig.tokens[i];
}

//wait till completion 'WTC', fill or kill 'FOK'
TokenPoolRequest.prototype.authenticatedRequest = function(options, type){
	var deferred = Q.defer();
	var self = this;
	//var tokenLimitInfo = self.tokenLimitInfo[resourceName];
	//console.log(tokenLimitInfo);
	var token = self.getTokenFromPool();
	console.log(token);
	var resets = [];

	// for(var i in tokenInfo){
	// 	resets.push(tokenInfo[i].reset);
	// 	console.log("Tokens Remaining: " + tokenInfo[i].remaining);
	// 	if(tokenLimitInfo[i].remaining != 0 && tokenLimitInfo == null){
	// 		tokenToApply = i;
	// 		tokenInfo[i].remaining--;
	// 		//break;
	// 	}
	// }

	// for(var i in tokenInfo){
	// 	resets.push(tokenInfo[i].reset);
	// }

	//console.log(resets);

	// if(tokenToApply == 'null'){
	// 	console.log("no more tokens");
	// 	if(type == 'WTC'){
	// 		var earliestReset = Math.min(resets);
	// 		if(earliestReset = -1){
	// 			console.log('No info found');
	// 			deferred.reject(new Error("No info on token reset found"));
	// 		}else{
	// 			var currEpoch = Math.floor((new Date).getTime()/1000); 
	// 			console.log("Going to sleep");
	// 			sleep(earliestReset - epochEpoch);
	// 			self.authenticatedRequest(options, type, resourceName);
	// 			return;
	// 		}
	// 	}
	// }

	self.insertTokenInOptions(options, token);

	self.makeRequest(options, deferred, type);

	// Request(options, function (error, response, body) {
 //    	if (error) {
 //    		//console.log(error);
 //        	deferred.reject(new Error(error));
 //    	} else {
 //    		try{
 //    			var limitReset = response.headers[self.tokenPoolConfig['headerLimitResetVar']];
 //    			var limitRemaining = response.headers[self.tokenPoolConfig['headerLimitRemainingVar']];
 //    			console.log(limitReset);
 //    			console.log(limitRemaining);
 //    			self.resourcePool[resourceName].reset = limitReset;
 //    		    self.resourcePool[resourceName].remaining = limitRemaining;
 //    		}catch(e){
 //    			//do nothing 
 //    		}
 //        	deferred.resolve(response);
 //    	}
	// });
	return deferred.promise;
}

// Recallable wrapper function for the web request
TokenPoolRequest.prototype.makeRequest = function(options, deferred, type){
	var self = this;
	Request(options, function (error, response, body){
		if(error){
			deferred.reject(new Error(error));
		}else{
     		var limitReset = response.headers[self.tokenPoolConfig['headerLimitResetVar']];
			var currEpoch = Math.floor((new Date).getTime()/1000);
			var waitPeriod = limitReset - currEpoch + self.tokenPoolConfig.resetOffset;
			if(response.statusCode == self.tokenPoolConfig.failureResponseCode){
				if(type == 'WTC'){
					console.log("Blocked for " + waitPeriod + " seconds");
					Q.delay(waitPeriod * 1000)
					 .then(function(){
					 	self.makeRequest(options, deferred, type)
					 });
				}
			}else{
				deferred.resolve(response);
			}
		}
	});
}

//Beta: probably never used
TokenPoolRequest.prototype.requestLimitInfoOnTokens = function(callback){
	var self = this;

	if(self.tokenPoolConfig == null) 
		throw new Error("TokenPoolConfig not set");

	var promisesArray = [];
	var checkLimitUrl = self.tokenPoolConfig.baseUrl + self.tokenPoolConfig.limitCheckPath;

	if(!ValidUrl.isUri(checkLimitUrl)){
		throw new Error("Invalid baseUrl or checkLimitPath in given tokenPoolConfig");
	}

	for (var i in self.tokenPoolConfig.tokens){	
		var options = {
			url: checkLimitUrl,
			headers: {
				'User-Agent' : 'LimitCheck'
			}
		}

		self.applyToken(options, i);
		promisesArray.push(self.promisedRequest(options));
	}

	Q.all(promisesArray).then(function(limitResponses){
		self.tokenLimitInfo = self.tokenLimitInfoRecipe(limitResponses);

		if(callback != null){
			callback(self.tokenLimitInfo);	
		}
	});
};

//Beta: probably never used
TokenPoolRequest.prototype.promisedRequest = function(options) {
	var deferred = Q.defer();
	Request(options, function (error, response, body) {
    	if (error) {
        	deferred.reject(new Error(error));
    	} else {
        	deferred.resolve(response);
    	}
	});
	return deferred.promise;
}

//Beta: probably never used
TokenPoolRequest.prototype.gitHubLimitInfoRecipe = function(limitResponses){
	console.log("Recipe Called");
	var limits = {
		search: {
			total: 0,
			induvidual: [

			]
		},
		core: {
			total: 0,
			induvidual: [

			]
		}
	};
	for(var i in limitResponses){
		var statusCode = limitResponses[i].statusCode;

		if(statusCode == 200){
			var body = JSON.parse(limitResponses[i].body);

			limits.search.total += body.resources.search.remaining;
			limits.core.total += body.resources.core.remaining;

			var induvidualSearch = {
				tokenId : i,
				remaining : body.resources.search.remaining,
				reset : body.resources.search.reset
			};

			var induvidualCore = {
				tokenId : i,
				remaining : body.resources.core.remaining,
				reset : body.resources.core.reset
			};

			limits.search.induvidual.push(JSON.stringify(induvidualSearch));
			console.log(limits);
			limits.core.induvidual.push(JSON.stringify(induvidualCore));

		}else{
			return null;
		}
	}
	return limits;
}

//Beta: pr
TokenPoolRequest.prototype.insertTokenInOptions = function(options, token){
	var self = this;	
	if(self.tokenPoolConfig.tokenLocation == "header"){
		options.headers['Authorization'] = self.tokenPoolConfig.tokenIdentifier + " " + token;
		console.log(options.headers['Authorization']);
	}else if(self.tokenPoolConfig.tokenLocation == "query"){
		if(options.qs == null){
			options.qs = {};
		}
		options.qs[self.tokenPoolConfig.tokenIdentifier] = token;
	}
}

module.exports = TokenPoolRequest;
