var express = require('express');
var router = express.Router();
var config = require('../config');
var social = require('../lib/social');
var mysql = require("../lib/mysql");

router.route("/auth/:provider").get(function(req, res) {
	var data = social.auth(req.params.provider);
	res.redirect(data.uri);
});

router.route("/callback/:provider").get(function(req, res) {
	console.log("Got callback", req.query);
	social.callback(req.params.provider, req.query.code)
	.then(function(result) {
		req.session.user = result;
		req.session.user.admin = false;
		mysql.getOne("users", { facebook_id : result.id })
		.then(function(sqluser) {
			console.log("sqluser", sqluser);
			if (!sqluser) {
				return mysql.insert("users", { 
					facebook_id: result.id,
					firstname: result.first_name,
					surname: result.last_name,
					email: result.email,
					picture: result.picture.data.url,
					token: result.token.access_token,
					age_range: result.age_range.min,
					last_login: new Date(),
				});
			} else {
				console.log(sqluser.id);
				if (sqluser.admin) {
					req.session.user.admin = true;
				}
				return mysql.update("users", sqluser.id, { last_login: new Date(), token: result.token.access_token });
			}
		})
		.then(function() {
			res.send(result);
		}, function(err) {
			console.log("Err", err);
			res.error("Unable to login");
		});
	}, function(err) {
		console.log("Error!", err);
		res.render("error", { message: err.error.message || "Something fucked up", error: err});
	});
});

module.exports = router;