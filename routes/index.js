var express = require('express');
var router = express.Router();
var mysql = require("../lib/mysql");

/* GET home page. */
router.get('/', function(req, res, next) {
	var game = null;
	var rapport_results = null;
	var user_results = null;
	mysql.query("SELECT * FROM `game` WHERE date_time < NOW() ORDER BY date_time DESC LIMIT 1")
	.then(function(result) {
		game = result.pop();
		return mysql.query("SELECT AVG(player_rating.rating) AS rating, player_rating.player_id, player.firstname, player.surname, player.photo, player.position FROM player_rating, player WHERE player.id = player_rating.player_id AND game_id = ? GROUP BY player_id", game.id);
	})
	.then(function(result) {
		user_results = result;
		return mysql.query("SELECT player_rating.rating AS rating, player_rating.player_id, player.firstname, player.surname, player.photo, player.position FROM player_rating JOIN player ON player_rating.player_id = player.id WHERE user_id = 1 AND game_id = ?", game.id);
	})
	.then(function(result) {
		rapport_results = result;
		res.render("index", { title: "BokRapport", game: game, rapport_results: rapport_results, user_results: user_results });
	})
	.then(null, function(err) {
		console.log("Error", err);
	})
	// res.render('index', { title: 'BokRapport' });
});

// Other routes - don't polute our app.js

var oauth = require('./oauth');
router.use('/oauth', oauth);

var users = require('./users');
router.use('/users', users);

var scrapers = require('./scrapers');
router.use('/scrapers', scrapers);

module.exports = router;
