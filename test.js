var R = require("./tokenpoolrequest"); 
var Q = require("q");

//1. Check limits on all token pools using given recipe
//2. When token pool is exhausted, request new resets and wait for the earliest reset
// if 'WTC' is selected. Else return all promise with an error of pool exhausted.
//3. On wakeup, recursively call the function and make sure current request is not
// executed. Once the request is successful, fullfill the promise.

// Taken an array of links that are polled.

//Add ability to check limits from headers later

//Take the recipe and use it for a check and spawn the number of times remaining
//When exhausted block for the given time.

//var yo = R;
//yo.bla();
//yo.set("lun kabab");
//yo.print();
//yo.printA();
//yo.printShit();
//yo.Request.printLora();

// var r = new R();
// yo.Request('http://www.google.com', function (error, response, body) {
//   if (!error && response.statusCode == 200) {
//     console.log(body) // Show the HTML for the Google homepage. 
//   }
// });

//yo.checkLimitOnTokens();

var options = {
	url: 'https://api.github.com/search/repositories?q=Matdderial+language:Java&sort=stars&order=desc',
	headers: {
		'User-Agent': 'request'
	}
}

// var TOKENCONFIG = {
// 	tokenLocation : 'query', //or query 
// 	tokenParam : 'access_token',  //etc
// 	tokens : ['6f7c88588ebe3a853242ccd1f989e1814ada444b', 'alalalalall','8b17010f26db6cc54ce76932504bb3fe964dfa93'],
// 	limitCheckPath : '/rate_limit',
// 	baseUrl : 'https://api.github.com',
// 	endpoints : ['search', 'resources'],
// 	headerLimitRemainingVar : 'X-Ratelimit-Remaining',
// 	headerLimitResetVar	: 'X-Ratelimit-Reset'
// };

var TOKENCONFIG = {
	tokenLocation : 'header', //or query 
	tokenIdentifier : 'Token',  //etc
	tokens : ['9a2b71d92c9053e913030f0b2bd92e83fcd439f5'],
	// limitCheckPath : '/rate_limit',
	// baseUrl : 'https://api.github.com',
	// endpoints : ['search', 'core'],
	//headerLimitRemainingVar : 'x-ratelimit-remaining',
	failureResponseCode : 403, //Default to 403
	headerLimitResetVar	: 'x-ratelimit-reset'
};

yo = new R(TOKENCONFIG);

//yo.setTokenLimitInfoRecipe(yo.gitHubLimitInfoRecipe);
//yo.requestLimitInfoOnTokens();
//yo.generateResourcePool(TOKENCONFIG);

 var promisesArray = [];
 for(var i = 0; i < 35; i++){
 	promisesArray.push(yo.authenticatedRequest(options, 'WTC', 'search'));
 }

 Q.all(promisesArray).then(function(responses){
 	for(var i = 0; i < responses.length; i++){
 		console.log(responses[i].statusCode);
 	}
 })

// Q.call(yo.requestLimitInfoOnTokens()).then(
// var promisesArray = [];
// for(var i = 0; i < 35; i++){
// 	promisesArray.push(yo.authenticatedRequest(options, 'WTC', 'search'));
// }
// return Q.all(promisesArray);

// Q.all(promisesArray).then(function(){
//  	console.log(yo.resourcePool);
//}
//)
//).then();

// var test = {
// 	i : 100
// }

// function test1(callback){
// 	callback(test.i);
// 	test.i --;
// }

// for(var j = 0; j < 100; j++){
// 	test1(console.log);
// }

// for(var i =0; i < 20; i++){
//   Q.delay(i*1000).then(function explode() {
//     //throw new Error("boo!");
//     console.log("Yo");
//   });
// }

// var setTimeout = (function(d){
// 	//console.log(d);
// 	return Q.defer().promise;
// }, 1000, i);

// yo.authenticatedRequest(options, 'WTC', 'search').then(function(data){
// 	//console.log(error);
// 	console.log(data.headers);
// }, function(err){
// 	console.log(err);
// });
//console.log((new Date).getTime());