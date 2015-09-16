var express = require('express');
var router = express.Router();
var mysql = require("../lib/mysql");
var moment = require("moment");

router.post("/login", function(req, res) {
	mysql.upsert("user", { facebook_id: req.body.facebook_id }, { facebook_id: req.body.facebook_id, firstname: req.body.firstname, surname: req.body.surname, email: req.body.email, picture: req.body.picture, admin: 0, last_login: moment().format("YYYY-MM-DD HH:mm:ss") })
	.then(function(result) {
		req.session.userId = result.id;
		req.session.facebookId = result.facebook_id;
		res.send(result);
	});
});

router.post("/rate", function(req, res) {
	var rating = req.body.rating;
	if (rating < 1) {
		console.log("Rating less than 1");
		mysql.remove("player_rating", { player_id: req.body.player_id, game_id: req.body.game_id, user_id: req.session.userId })
		.then(function(result) {
			res.send(result);
			return;
		});
	} else if (rating > 10) {
		res.send("Rating cannot be greater than 10");
		return;
	} else {
		console.log("UserID", req.session.userId);
		mysql.upsert("player_rating", { player_id: req.body.player_id, game_id: req.body.game_id, user_id: req.session.userId }, { player_id: req.body.player_id, game_id: req.body.game_id, user_id: req.session.userId, rating: req.body.rating, timestamp: moment().format("YYYY-MM-DD HH:mm:ss") })
		.then(function(result) {
			res.send(result);	
		}, function(err) {
			console.log("error", err);
			res.send(err);
		});
	}
});

router.get("/rating/avg/:game/:player", function(req, res) {
	mysql.query("SELECT AVG(player_rating.rating) AS rating, player_rating.player_id FROM player_rating WHERE game_id = ? AND player_id = ? GROUP BY player_id", [req.params.game, req.params.player])
	.then(function(result) {
		res.send(result[0]);
	})
});

router.get("/rating/avg/:game", function(req, res) {
	mysql.query("SELECT AVG(player_rating.rating) AS rating, player_rating.player_id FROM player_rating WHERE game_id = ? GROUP BY player_id", [req.params.game])
	.then(function(result) {
		res.send(result[0]);
	})
});

module.exports = router;