var express = require('express');
var router = express.Router();
var mysql = require("../lib/mysql");
var moment = require("moment-timezone");

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
	console.log("Session", req.session);
	var game = null;
	var rapport_results = null;
	var user_results = null;
	var avg_results = null;
	var countries = null;
	mysql.query("SELECT game.*, UNIX_TIMESTAMP(game.date_time) AS utime, venue.name AS venue_name, venue.city FROM `game` JOIN venue ON venue.id = game.venue_id WHERE date_time < NOW() ORDER BY date_time DESC LIMIT 1")
	.then(function(result) {
		game = result.pop();
		return mysql.query("SELECT country.*, country_game.score FROM country_game JOIN country ON country_game.country_id = country.id WHERE country_game.game_id = ?", game.id);
	})
	.then(function(result) {
		countries = result;
		return mysql.query("SELECT player_rating.rating AS rating, player_rating.player_id, player.firstname, player.surname, player.photo, player.position, player.id FROM player_rating JOIN player ON player_rating.player_id = player.id WHERE user_id = 1 AND game_id = ? GROUP BY player_rating.player_id", game.id);
	})
	.then(function(result) {
		rapport_results = result;
		return mysql.query("SELECT player_rating.rating AS rating, player_rating.player_id FROM player_rating WHERE game_id = ? AND user_id = ?", [game.id, req.session.userId ]);
	})
	.then(function(result) {
		user_results = result;
		return mysql.query("SELECT AVG(player_rating.rating) AS rating, player_rating.player_id FROM player_rating WHERE game_id = ? GROUP BY player_id", game.id);
	})
	.then(function(result) {
		var avg_results = result;
		//Combine our averages with Rapport score
		players = rapport_results.map(function(rapport_result) {
			var tmp = avg_results.find(function(avg_result) {
				return avg_result.player_id == rapport_result.player_id;
			});
			if (tmp) {
				rapport_result.avg_rating = tmp.rating;
			} else {
				rapport_result.avg_rating = 0;
			}
			if (user_results) {
				console.log("User results", user_results);
				var tmp = user_results.find(function(user_result) {
					return user_result.player_id == rapport_result.player_id;
				});
				if (tmp) {
					rapport_result.user_rating = tmp.rating;
				} else {
					rapport_result.user_rating = 0;	
				}
			} else {
				rapport_result.user_rating = 0;
			}
			console.log(rapport_result);
			return rapport_result;
		});
		game.utime = moment(game.utime * 1000).tz("Africa/Johannesburg").format("d MMM YYYY");
		res.render("index", { title: "BokRapport", game: game, players: players, rapport_results: rapport_results, avg_results: avg_results, countries: countries, user_results: user_results });
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

var api = require("./api");
router.use("/api", api);

module.exports = router;
