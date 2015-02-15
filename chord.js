var net = require('net');
var url = require('url');
var crypto = require('crypto');
var http = require('http');

// Helper functions
var serialize = function serialize(message) {
    return new Buffer(JSON.stringify(message));
};

var deserialize = JSON.parse;

var isJSONRequest = function (request) {
    return request.headers.accept && request.headers.accept.indexOf("application/json") > -1;
}

var randomInt = function (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}


// Node should have a successor Assumption: At least *one* node is
// reliable and always online.
//
// Basic ChordNode is implemented referencing Wikipedia
// http://en.wikipedia.org/wiki/Chord_%28peer-to-peer%29#Pseudocode
function ChordNode (ip, port) {

    // Initialize node properties
    var shasum = crypto.createHash('sha1');
    var id = shasum.update(ip + port).digest("hex");
    this.options = {
	id: id,
	ip: ip,
	port: port,

	predecessor: {},
	successor: {
	    ip: ip,
	    port: port,
	    id: id
	}
    };

    var self = this;

    // Every node has a http Server This server will serve JSON for
    // other peers and standard html for browsers
    this.server = http.createServer();
    
    this.updateNode = function(server) {
	server.on('request', function (request, response) {

	    var JSONString = JSON.stringify(self.options);

	    if (isJSONRequest(request)) {
		response.writeHead(200, {
		'Content-Type': 'application/json'});
		response.write(JSONString);
		response.end();

	    } else {
		response.writeHead(200, { 'Content-Type': "text/html" });
		
		var buffer = "<html><body>";
		buffer += "<a href=http://" + self.options.successor.ip + ":" + self.options.successor.port + "> &lt;&lt;  " + self.options.successor.id + "</a>";
		buffer += "<br><br>";
		buffer += JSONString;
		buffer += "<br><br>";
		buffer += "<a href=http://" + self.options.predecessor.ip + ":" + self.options.predecessor.port + ">  " + self.options.predecessor.id + " &gt;&gt; </a>";
		buffer += "</body></html>";
		response.write(buffer);
		response.end();
	    }});
    }

    // Join: find the successor
    this.join = function (node) {
	self.findSuccessor (node, function (suc) {
	    self.options.successor = suc;
	    self.updateNode(self.server);
	});
    }

    this.findSuccessor = function (node, callback) {

	options = {
	    hostname: node.ip,
	    port: node.port,
	    headers: {
		'Accept': 'application/json'
	    }
	}
	
	var req = http.request(options, function(res) {
	    console.log('STATUS: ' + res.statusCode);
	    console.log('HEADERS: ' + JSON.stringify(res.headers));
	    
	    res.setEncoding('utf8');
	    res.on('data', function (chunk) {
		var JSONResponse = deserialize(chunk);

		var nodeId = JSONResponse.id;
		var successorNode = JSONResponse.successor;
		var successorId = successorNode.id;
		if (Object.keys(JSONResponse.predecessor).length === 0) {
		    callback(successorNode);
		    return;
		}
		var predecessorNode = JSONResponse.predecessor;
		if (id < nodeId && id <= successorId) {
		    callback(successorNode);
		} else {
		    return self.findSuccessor(predecessorNode);
		}
	    });
	});

	req.write("");
	req.end();
    }

    this.updateNode(self.server);
    self.server.listen(port);
}


// Test Suite
var node1 = new ChordNode("127.0.0.1", 8080);
var node2 = new ChordNode("127.0.0.1", 8081);
var node3 = new ChordNode("127.0.0.1", 8082);
var node4 = new ChordNode("127.0.0.1", 8083);
node2.join({ip: "127.0.0.1", port: 8080});
node3.join({ip: "127.0.0.1", port: 8080});
node4.join({ip: "127.0.0.1", port: 8080});



console.log("Node with id: " + node1.options.id + " has been launched\n");
console.log("Node with id: " + node2.options.id + " has been launched\n");

// Interactive Part
// Platform for launching peers
// process.stdin.setEncoding('utf8');
// console.log("Add random note by hitting ENTER...\n");
// console.log("Connect to specific node by writing port");

// process.stdin.on('data', function(data) {
//     var parts = data.split(' ');
//     var port = parseInt(parts[0]) || randomInt(8000, 15000);
//     var node = new ChordNode("127.0.0.1", port);
//     console.log("Node with port: " + node.port + " has been launched\n");
// });






