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
	'headerLimitRemainingVar' : 0,
	'headerLimitResetVar'	: 0
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

//wait till completion 'WTC', fill or kill 'FOK'
TokenPoolRequest.prototype.authenticatedRequest = function(options, type, resourceName){
	var deferred = Q.defer();
	var self = this;
	var tokenInfo = self.resourcePool[resourceName];
	var tokenToApply = null;
	var resets = [];

	if(tokenInfo.length == 0){
		deferred.reject(new Error("No tokens found"));
	}

	console.log("tokensFound");

	for(var i in tokenInfo){
		if(tokenInfo[i].remaining != 0 ){
			tokenToApply = i;
			tokenInfo[i].remaining--;
			break;
		}
	}

	for(var i in tokenInfo){
		resets.push(tokenInfo[i].reset);
	}

	console.log(resets);

	if(tokenToApply == 'null'){
		if(type == 'WTC'){
			var earliestReset = Math.min(resets);
			if(earliestReset = -1){
				console.log('No info found');
				deferred.reject(new Error("No info on token reset found"));
			}else{
				var currEpoch = Math.floor((new Date).getTime()/1000); 
				console.log("Going to sleep");
				sleep(earliestReset - epochEpoch);
				self.authenticatedRequest(options, type, resourceName);
				return;
			}
		}
	}

	console.log("Before Request");
	self.applyToken(options, tokenToApply);

	Request(options, function (error, response, body) {
    	if (error) {
    		//console.log(error);
        	deferred.reject(new Error(error));
    	} else {
    		try{
    			tokenInfo[tokenToApply].reset = rawHeaders[self.tokenPoolConfig[headerLimitResetVar]];
    		}catch(e){
    			//do nothing 
    		}
        	deferred.resolve(response);
    	}
	});
	return deferred.promise;
}

//Beta: probably never used
TokenPoolRequest.prototype.requestLimitInfoOnTokens = function(recipe, callback){
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
	var limits = {
		search: {
			total: 0,
			induvidual: [

			]
		}
	};
	for(var i in limitResponses){
		var statusCode = limitResponses[i].statusCode;
		if(statusCode == 200){
			var body = JSON.parse(limitResponses[i].body);
			//console.log(body.resources.search.remaining);
			limits.search.total += body.resources.search.remaining;
			var induvidual = {
				'tokenId' : i,
				'remaining' : body.resources.search.remaining,
				'reset' : body.resources.search.reset
			}
			limits.search.induvidual.push(induvidual);
		}
	}
	console.log(limits);
	return limits;
	//console.log(limits);
}

//Beta: probably never used
TokenPoolRequest.prototype.applyToken = function(options, tokenIndex){
	var self = this;	
	if(self.tokenPoolConfig.tokenLocation == "header"){
		options.headers['Authorization'] = self.tokenPoolConfig.tokenParam + " " + self.tokenPoolConfig.tokens[tokenIndex];
	}else if(self.tokenPoolConfig.tokenLocation == "query"){
		if(options.qs == null){
			options.qs = {};
		}
		options.qs[self.tokenPoolConfig.tokenParam] = self.tokenPoolConfig.tokens[tokenIndex];
	}
}

module.exports = TokenPoolRequest;
