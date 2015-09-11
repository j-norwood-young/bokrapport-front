var express = require('express');
var router = express.Router();
var mysql = require("./mysql");
var moment = require("moment");

router.get("/", function(req, res, next) {
	//Check if we have a session. If not, create a new 'user'
	console.log("Checking session");
	if (!req.session.userId) { // New user
		console.log("No session, creating one");
		mysql.insert("user", { facebook_id: null, admin: 0, last_login: moment().format("YYYY-MM-DD HH:mm:ss") })
		.then(function(result) {
			console.log("Insert Result", result);
			req.session.userId = result;
			return mysql.get("user", req.session.userId);
			
		})
		.then(function(result) {
			req.user = result;
			next();
		})
		.then(null, function(err) {
			console.log("Error", err);
			res.error(err);
		});
	} else {
		console.log("Found user", req.session.userId);
		mysql.get("user", req.session.userId)
		.then(function(result) {
			console.log(result);
			req.user = result;
			next();
			return;
		}, function(err) {
			console.log("Error", err);
			res.error(err);
		});
	}
	// next();
});

module.exports = router;