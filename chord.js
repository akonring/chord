var net = require('net');
var url = require('url');
var crypto = require('crypto');
var http = require('http');
var misc = require('./chordmisc.js');

// Node should have a successor Assumption: At least *one* node is
// reliable and always online.
//
// Basic ChordNode is implemented referencing Wikipedia
// http://en.wikipedia.org/wiki/Chord_%28peer-to-peer%29#Pseudocode
var ChordNode = function (ip, port) {

    // Initialize node properties
    var shasum = crypto.createHash('sha1');
    var id = port % 10;//shasum.update(ip + port).digest("hex");
    // Simple datastructure that holds the state of the node
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
    // other nodes and standard html for browsers
    this.server = http.createServer();

    // Updating the node means making the server consistent with the
    // state of the node
    this.updateNode = function(server) {
	server.on('request', function (request, response) {
	    
	    var JSONString = misc.serialize(self.options);

	    if (misc.isJSONRequest(request)) {
		if(misc.isNotifyQuery(request)) {
		    var queryString = url.parse(request.url, true);
		    var queryId = queryString.query.id;
		    var queryIp = queryString.query.ip;
		    var queryPort = queryString.query.port;
		    if (misc.isEmpty(self.options.predecessor) ||
			(self.options.predecessor.id < queryId && queryId < self.options)) {

			self.options.predecessor = {id: queryId, ip: queryIp, port: queryPort};
			self.updateNode(self.server);
		    }
		}
		    
		response.writeHead(200, {
		    'Content-Type': 'application/json'});
		response.write(JSONString);
		response.end();

	    } else {
		response.writeHead(200, { 'Content-Type': "text/html" });
		
		var buffer = "<html><body>";
		buffer += "<a href=http://" + self.options.successor.ip + ":" + self.options.successor.port + "> &lt;&lt;  " + self.options.successor.port + " - "  + self.options.successor.id + "</a>";
		buffer += "<br><br>";
		buffer += JSONString;
		buffer += "<br><br>";
		buffer += "<a href=http://" + self.options.predecessor.ip + ":" + self.options.predecessor.port + ">  " + self.options.predecessor.port + " - "  + self.options.predecessor.id + " &gt;&gt; </a>";
		buffer += "</body></html>";
		response.write(buffer);
		response.end();
	    }
	});
    }

    // Join: find the successor
    this.join = function (node) {
	
	findSuccessor (node, function (suc) {
	    self.options.successor = suc;
	    self.updateNode(self.server);
	});
    }

    var findSuccessor = function (node, callback) {
	options = {
	    hostname: node.ip,
	    port: node.port,
	    headers: {
		'Accept': 'application/json'
	    }
	}
	
	var request = http.request(options, function(response) {
	    response.setEncoding('utf8');
	    response.on('data', function (chunk) {

		var JSONResponse = misc.deserialize(chunk);

		var nodeId = JSONResponse.id;
		var successorNode = JSONResponse.successor;
		var successorId = successorNode.id;

		console.log("inHalfOpenRange - self: " + self.options.id +", low: " + nodeId + ", high: "+ successorId); 
		if (misc.inHalfOpenRange(self.options.id, nodeId, successorId)) {
		    callback (successorNode);
		} else {
		    console.log(successorNode);
		    return findSuccessor(successorNode, callback);
		}
	    });
	});

	request.write("");
	request.end();
    }

    // called periodically. n asks the successor
    // about its predecessor, verifies if n's immediate
    // successor is consistent, and tells the successor about n
    this.stabilize = function () {
	if (self.options.successor.id == self.options.id
	    && misc.isEmpty(self.options.predecessor)) {
	    return;
	}
	var options = {
	    hostname: self.options.successor.ip,
	    port: self.options.successor.port,
	    headers: {
		'Accept': 'application/json'
	    }
	}
	var request = http.request(options, function(response) {
	    response.setEncoding('utf8');
	    response.on('data', function (chunk) {
		var JSONResponse = misc.deserialize(chunk);
		var nodeId = JSONResponse.id;
		var predecessorNode = JSONResponse.predecessor;
		var successorNode = JSONResponse.successor;

		if (misc.inRange(predecessorNode.id, self.options.id, nodeId)) {
		    self.options.successor = predecessorNode;
		    self.updateNode(self.server);
		}
		notify(self.options.successor);
	    });
	});

	request.write("");
	request.end();
    }

    var notify = function (nodecall) {
	var options = {
	    hostname: self.options.successor.ip,
	    port: self.options.successor.port,
	    headers: {
		'Accept': 'application/json'
	    },
	    path: '/notify?id=' + self.options.id + "&ip=" + self.options.ip + "&port=" + self.options.port
	}

	var request = http.request(options);

	request.write('');
	request.end();
    }

    this.timer = function () {
    	setTimeout(function() {
    	    console.log("Stabilizing");
    	    self.stabilize();
    	    self.timer();
    	}, 10000);
    }

    this.timer();
    
    this.updateNode(self.server);
    self.server.listen(port);

}

module.exports = ChordNode;






