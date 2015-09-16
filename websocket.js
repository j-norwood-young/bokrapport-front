var server = require('http').createServer();
var url = require('url');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });
var config = require("./config");


wss.on('connection', function connection(ws) {
	console.log("Got connection");
	ws.data="No Data";
	// you might use location.query.access_token to authenticate or share sessions
	// or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		try {
			var msg = JSON.parse(message);
			console.log("JSON Parsed message", msg);
			if ((msg.isVote) && (msg.rating < 10)) {
				console.log("Senging to clients", wss.clients.length);
				wss.clients.forEach(function(targetWs) {
					if (ws.upgradeReq.url == targetWs.upgradeReq.url) {
						targetWs.send(JSON.stringify({
							player_id: msg.player_id,
							picture: msg.picture,
							user_id: msg.user_id,
							rating: msg.rating
						}));
					}
				});
			}	
		} catch(e) {
			console.log(e);
		}
	});

	ws.send('something');
});

var i = 0;
// setInterval(function() {
// 	var clientId = 0;
// 	wss.clients.forEach(function(ws) {
// 		// console.log(ws);
// 		// var location = url.parse(ws.upgradeReq.url, true);
// 		console.log(ws.upgradeReq.url);
// 		ws.send("Event " + i + ", Client " + clientId++ + ", Data " + ws.data);
// 	});
// 	i++;
// }, 5000)

server.listen(config.websocket_port, function () { console.log('Listening on ' + server.address().port) });
