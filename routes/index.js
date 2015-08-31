var express = require('express');
var router = express.Router();
var mysql = require("../lib/mysql");

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

/* GET home page. */
router.get('/', function(req, res, next) {
	var game = null;
	var rapport_results = null;
	var user_results = null;
	var countries = null;
	mysql.query("SELECT game.*, venue.name AS venue_name, venue.city FROM `game` JOIN venue ON venue.id = game.venue_id WHERE date_time < NOW() ORDER BY date_time DESC LIMIT 1")
	.then(function(result) {
		game = result.pop();
		return mysql.query("SELECT country.*, country_game.score FROM country_game JOIN country ON country_game.country_id = country.id WHERE country_game.game_id = ?", game.id);
	})
	.then(function(result) {
		countries = result;
		return mysql.query("SELECT player_rating.rating AS rating, player_rating.player_id, player.firstname, player.surname, player.photo, player.position FROM player_rating JOIN player ON player_rating.player_id = player.id WHERE user_id = 1 AND game_id = ? GROUP BY player_rating.player_id", game.id);
	})
	.then(function(result) {
		rapport_results = result;
		return mysql.query("SELECT AVG(player_rating.rating) AS rating, player_rating.player_id FROM player_rating WHERE game_id = ? GROUP BY player_id", game.id);
	})
	.then(function(result) {
		var user_results = result;
		//Combine our averages with Rapport score
		players = rapport_results.map(function(rapport_result) {
			var tmp = user_results.find(function(user_result) {
				return user_result.player_id == rapport_result.player_id;
			});
			rapport_result.avg_rating = tmp.rating;
			return rapport_result;
		});
		console.log(players);
		res.render("index", { title: "BokRapport", game: game, playser: players, rapport_results: rapport_results, user_results: user_results, countries: countries });
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
