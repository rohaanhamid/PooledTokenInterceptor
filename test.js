var R = require("./tokenpoolrequest"); 

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
	url: 'https://api.github.com/search/repositories?q=Material+language:Java&sort=stars&order=desc',
	headers: {
		'User-Agent': 'request'
	}
}

var TOKENCONFIG = {
	tokenLocation : 'query', //or query 
	tokenParam : 'access_token',  //etc
	tokens : ['6f7c88588ebe3a853242ccd1f989e1814ada444b', 'alalalalall','8b17010f26db6cc54ce76932504bb3fe964dfa93'],
	limitCheckPath : '/rate_limit',
	baseUrl : 'https://api.github.com',
	endpoints : ['search', 'resources'],
	headerLimitRemainingVar : 'X-Ratelimit-Remaining',
	headerLimitResetVar	: 'X-Ratelimit-Reset'
};

yo = new R(TOKENCONFIG);

options.headers['Authorization'] = 'lora';

//yo.setTokenLimitInfoRecipe(yo.gitHubLimitInfoRecipe);
//yo.requestLimitInfoOnTokens();
yo.generateResourcePool(TOKENCONFIG);
yo.authenticatedRequest(options, 'WTC', 'search').then(function(data){
	//console.log(error);
	//console.log(data);
}, function(err){
	console.log(err);
});
//console.log((new Date).getTime());