var Request = require('request');
var Q = require('q');
var ValidUrl = require('valid-url');

var TokenPoolRequest = function(tokenPoolConfig) {
	var self = this;
	self.Request = Request;

	if(tokenPoolConfig.tokens == null){
		throw new Error("No tokens found");
	}

	self.tokenPoolConfig = tokenPoolConfig;

	self.tokenPoolConfig['currToken'] = 0; //Start by the first token

	if(self.tokenPoolConfig['resetOffset'] == null){
		self.tokenPoolConfig['resetOffset'] = 5; //Set a default to 5 sec
	}
};

TokenPoolRequest.prototype.setTokenPoolConfig = function(tokenPoolConfig){
	var self = this;
	self.tokenPoolConfig = tokenPoolConfig;
};

TokenPoolRequest.prototype.getTokenPoolConfig = function(){
	var self = this;
	return self.tokenPoolConfig;
};

// Distribute tokens from the supplied pool in a round robin pattern
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

TokenPoolRequest.prototype.authenticatedRequest = function(options, type){
	var deferred = Q.defer();
	var self = this;

	var token = self.getTokenFromPool();
	var resets = [];

	self.insertTokenInOptions(options, token);

	self.makeRequest(options, deferred, type);

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
			if(response.statusCode == self.tokenPoolConfig.failureResponseCode
				&& type == 'WTC'){
					console.log("Blocked for " + waitPeriod + " seconds");
					Q.delay(waitPeriod * 1000)
					 .then(function(){
					 	self.makeRequest(options, deferred, type)
					 });
			}else{
				deferred.resolve(response);
			}
		}
	});
}

TokenPoolRequest.prototype.insertTokenInOptions = function(options, token){
	var self = this;	
	if(self.tokenPoolConfig.tokenLocation == "header"){
		options.headers['Authorization'] = self.tokenPoolConfig.tokenIdentifier + " " + token;
	}else if(self.tokenPoolConfig.tokenLocation == "query"){
		if(options.qs == null){
			options.qs = {};
		}
		options.qs[self.tokenPoolConfig.tokenIdentifier] = token;
	}
}

module.exports = TokenPoolRequest;
