var express = require('express');
var router = express.Router();
var mysql = require("./mysql");
var moment = require("moment");
var q = require("q");

function randomString(length) {
	return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

var createUser = function() {
	var deferred = q.defer();
	mysql.insert("user", { unique_id: randomString(16), facebook_id: null, admin: 0, last_login: moment().format("YYYY-MM-DD HH:mm:ss") })
	.then(function(result) {
		return mysql.getOne("user", result);
	})
	.then(function(result) {
		deferred.resolve(result);
	})
	.then(null, function(err) {
		console.log("Error", err);
		deferred.reject(err);
	});
	return deferred.promise;
}

router.use(function(req, res, next) {
	//Check if we have a session. If not, create a new 'user'
	console.log("Checking session");
	if (!req.session.userId) { // New user
		console.log("No session, creating one");
		createUser
		.then(function(result) {
			res.locals.userId = req.session.userId = result.id;
			res.locals.fbLoggedIn = (result.facebook_id);
			res.locals.user = result;
			next();
		});
	} else {
		console.log("Found user", req.session.userId);
		mysql.getOne("user", req.session.userId)
		.then(function(result) {
			if (result) {
				console.log("User", result);
				res.locals.user = result;
				res.locals.fbLoggedIn = (result.facebook_id);
				res.locals.userId = result.id;
				next();
			} else {
				console.log("Missing user");
				createUser
				.then(function(result) {
					console.log("User", result);
					res.locals.userId = req.session.userId = result.id;
					res.locals.fbLoggedIn = (result.facebook_id);
					res.locals.user = result;
					next();
				}, function(err) {
					console.log("Error", err);
					res.error(err);
				});
			}
			return;
		}, function(err) {
			console.log("Error", err);
			res.error(err);
		});
	}
});

module.exports = router;