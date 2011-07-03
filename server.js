var sys = require("sys"),
	http = require("http"),
	url = require("url"),
	path = require("path"),
	util  = require("util"),
	EventEmitter = require("events").EventEmitter,
	fs = require("fs");

var TwitterClient = function() {
	console.log("init");
};

util.inherits(TwitterClient, EventEmitter);

var opts = {
	host: 'api.twitter.com',
	port: 80,
	path: '/1/statuses/public_timeline.json'
};

http.createServer(function(request, response){
	var uri = url.parse(request.url).pathname;
	if(uri === "/stream"){
		var req = http.get(opts, function(res) {
			string = "";
			res.setEncoding('utf8');
			res.on('data', function(data){
				string += data;
			});
			res.on('end', function() {
				var req = http.get(opts, function(res) {
					string = "";
					res.setEncoding('utf8');
					res.on('data', function(data){
						string += data;
					});
					res.on('end', function() {
						response.writeHead(200, {"Content-Type": "text/plain"});
						response.end(string);
					});
				});
			});
		});
	}
	else{
		var filename = path.join(process.cwd(), uri);
		path.exists(filename, function(exists) {
			if(!exists){
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.end("404");
			}
			else{
				fs.readFile(filename, "binary", function(err, file){
					if(err){
						response.writeHead(500, {"Content-Type": "text/plain"});
						response.write(err + "\n");
						response.end();
					}
					else{
						response.writeHead(200);
						response.write(file, "binary");
						response.end();
					}
				});
			}
		});
	}
}).listen(8080, "127.0.0.1");
