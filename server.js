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

t = new TwitterClient();

var opts = {
    host: 'api.twitter.com',
    port: 80,
    path: '/1/statuses/public_timeline.json'
};

function get_tweets(){
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
                    t.emit("tweets", string);
                });
            }); 
        });
    });
}


http.createServer(function(request, response){
    var uri = url.parse(request.url).pathname;
    if(uri === "/stream"){
        //Stream tweets to the client
        get_tweets();
        function tweet_listener(string){
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.end(string);
            clearTimeout(timeout);
        }
        t.on("tweets", tweet_listener);
        var timeout = setTimeout(function(){
            var blank_response = "";
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.end(blank_response);
            t.removeListener("tweets", tweet_listener);
        }, 10000);
    }
    else{
        //serve the file to the client
        var filename = path.join(process.cwd(), uri);
        path.exists(filename, function(exists) {
            if(exists){
                fs.stat(filename, function(err, stat) {
                    var rs;
                    if (err) {
                        response.writeHead(500);
                        response.end("Error reading the file.");
                    }
                    if (stat.isDirectory()){
                        response.writeHead(403);
                        response.end("Cannot display directories.");
                    }
                    else{
                        rs = fs.createReadStream(filename);
                        response.writeHead(200);
                        rs.pipe(response);
                    }
                });
            }
            else{
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.end("404: Not Found!");
            }
        });
    }
}).listen(8080, "127.0.0.1");
