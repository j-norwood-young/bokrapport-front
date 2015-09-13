var express = require('express');
var router = express.Router();
var config = require('../config');
var social = require('../lib/social');
var mysql = require("../lib/mysql");
var q = require("q");


var mergeUser = function(targetId, sourceId) {
	var deferred = q.defer();
	// SELECT * FROM (SELECT * FROM `player_rating` WHERE user_id = 1 OR user_id = 21 ORDER BY timestamp DESC) AS t1 GROUP BY game_id, player_id
	mysql.query("SELECT id FROM (SELECT * FROM (SELECT * FROM `player_rating` WHERE user_id = ? OR user_id = ? ORDER BY timestamp DESC) AS t1 GROUP BY game_id, player_id) AS t2 WHERE user_id <> ?", [targetId, sourceId, targetId ])
	.then(function(result) {
		var ids = result.map(function(id) {
			return id.id;
		});
		if (ids.length) {
			return mysql.query("UPDATE player_rating SET user_id = ? WHERE id IN (" + ids.join(",") + ")", [ targetId ])
		} else {
			return true;
		}
	})
	.then(function(result) {
		return mysql.remove("player_rating", { user_id: sourceId })
	})
	.then(function(result) {
		return mysql.remove("user", { id: sourceId })
	})
	.then(function(result) {
		console.log("All done!");
		deferred.resolve(result);
	}, function(err) {
		console.log("Error", err);
		deferred.reject(err);
	})
	
	return deferred.promise;
}

router.route("/auth/:provider").get(function(req, res) {
	var data = social.auth(req.params.provider);
	res.redirect(data.uri);
});

router.route("/callback/:provider").get(function(req, res) {
	var fbData = {};
	console.log("Got callback", req.query);
	social.callback(req.params.provider, req.query.code)
	.then(function(result) {
		console.log(result);
		fbData = result;
		return mysql.getOne("user", { facebook_id: fbData.id })
	})
	.then(function(result) {
		if (result) {
			// User already exists but has another User ID. Now we have a problem...
			return mergeUser(req.session.userId, result.id);
		}
		return true;
	})
	.then(function() {
		console.log("https://graph.facebook.com/" + fbData.id + "/picture?width=200&height=200&redirect=false&access_token=" + fbData.token.access_token);
		return social.call("https://graph.facebook.com/" + fbData.id + "/picture?width=100&height=100&redirect=false&access_token=" + fbData.token.access_token);
	})
	.then(function(result) {
		console.log("Picture", result);
		fbData.picture = result;
		console.log("Updating user");
		return mysql.update("user", { id: req.session.userId }, { 
			facebook_id: fbData.id,
			firstname: fbData.first_name,
			surname: fbData.last_name,
			email: fbData.email,
			picture: fbData.picture.data.url,
			token: fbData.token.access_token,
			age_range: fbData.age_range.min,
		});
	})
	.then(function(result) {
		res.redirect("/");
	})
	.then(null, function(err) {
		console.log("Error!", err);
		res.render("error", { message: err.error.message || "Something went wrong", error: err});
	});
});

module.exports = router;