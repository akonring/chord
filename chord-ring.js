var ChordNode = require('./chord.js');
var misc = require('./chordmisc.js');


// Tests
// Interactive Part
// Platform for launching peers
process.stdin.setEncoding('utf8');

var port = parseInt(process.argv[2]) || misc.randomInt(8000, 15000);
var node = new ChordNode("127.0.0.1", port);
console.log("Node with port: " + port + " has been launched\n");

// USAGE::
// example::
// node chord-ring.js 8080
// join 127.0.0.1 8081

process.stdin.on('data', function(data) {
    data = data.replace('\n', '').replace('\r', '');
    var parts = data.split(' ');
    if (data.indexOf('join') == 0) {
	if (parts.length >= 3 && parts[1] && parts[2]) {
	    node.join({ip: parts[1], port: parts[2]});
	} 
    } else if (data == 'leave') {
	process.stdout.write('Leaving the network\r\n');
	if (node) {
	    node.leave(chordNode);
	}
    } else if (data == 's') {
	process.stdout.write('stabilizing\r\n');
	if (node) {
	    node.stabilize();
	}
    } else if (data == 'exit') {
	process.exit();
    } else {
	process.stdout.write(' join <ipaddress> <port> : Join the network with known node\r\n leave: Leave the network\r\n exit : Exit the application\r\n');
    }
});





