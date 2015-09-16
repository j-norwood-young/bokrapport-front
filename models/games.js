var mysql = require("../lib/mysql");
var moment = require("moment-timezone");
var Q = require("q");

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

var game = function(id, userId) {
	var deferred = Q.defer();
	var game = null;
	var rapport_results = null;
	var players = null;
	var user_results = null;
	var avg_results = null;
	var countries = null;
	mysql.query("SELECT game.*, UNIX_TIMESTAMP(game.date_time) AS utime, venue.name AS venue_name, venue.city FROM `game` JOIN venue ON venue.id = game.venue_id WHERE game.id = ? ORDER BY date_time DESC LIMIT 1", [ id ])
	.then(function(result) {
		if (!result.length) {
			deferred.reject(new Error("Not found"));
			return;
		}
		game = result.pop();
		return mysql.query("SELECT country.*, country_game.score FROM country_game JOIN country ON country_game.country_id = country.id WHERE country_game.game_id = ?", game.id);
	})
	.then(function(result) {
		countries = result;
		return mysql.query("SELECT player.common_name, player.firstname, player.surname, player.photo, player.position, player.id FROM game_player JOIN player ON player.id = game_player.player_id WHERE game_player.game_id = ? ORDER BY game_player.sort_order DESC", game.id);
	})
	.then(function(result) {
		players = result;
		return mysql.query("SELECT player_rating.rating AS rating, player_rating.player_id FROM player_rating WHERE user_id = 1 AND game_id = ? GROUP BY player_rating.player_id", game.id);
	})
	.then(function(result) {
		rapport_results = result;
		return mysql.query("SELECT player_rating.rating AS rating, player_rating.player_id FROM player_rating WHERE game_id = ? AND user_id = ?", [game.id, userId ]);
	})
	.then(function(result) {
		user_results = result;
		return mysql.query("SELECT AVG(player_rating.rating) AS rating, player_rating.player_id FROM player_rating WHERE game_id = ? GROUP BY player_id", game.id);
	})
	.then(function(result) {
		avg_results = result;
		//Combine our averages with Rapport score
		// players = rapport_results.map(function(rapport_result) {
		// 	var tmp = avg_results.find(function(avg_result) {
		// 		return avg_result.player_id == rapport_result.player_id;
		// 	});
		// 	if (tmp) {
		// 		rapport_result.avg_rating = Math.round(tmp.rating);
		// 	} else {
		// 		rapport_result.avg_rating = 0;
		// 	}
		// 	if (user_results) {
		// 		console.log("User results", user_results);
		// 		var tmp = user_results.find(function(user_result) {
		// 			return user_result.player_id == rapport_result.player_id;
		// 		});
		// 		if (tmp) {
		// 			rapport_result.user_rating = tmp.rating;
		// 		} else {
		// 			rapport_result.user_rating = 0;	
		// 		}
		// 	} else {
		// 		rapport_result.user_rating = 0;
		// 	}
		// 	return rapport_result;
		// });
		game.utime = moment(game.utime * 1000).tz("Africa/Johannesburg").format("d MMM YYYY");
		return mysql.query("SELECT player_rating.user_id, player_rating.player_id, player_rating.rating, player_rating.timestamp, user.picture FROM `player_rating` JOIN user ON user.id=user_id WHERE game_id = ? ORDER BY timestamp DESC", game.id );
	}).then(function(result) {
		players.forEach(function(player) {
			player.votes = result.filter(function(rating) {
				return rating.player_id == player.player_id;
			}).slice(0, 5).reverse();
		})
		// console.log(players);
		deferred.resolve({ game: game, players: players, rapport_results: rapport_results, avg_results: avg_results, countries: countries, user_results: user_results });
	})
	.then(null, function(err) {
		console.log("Error", err);
		deferred.reject(err);
	});
	return deferred.promise;
}

var latestGame = function(userId) {
	var deferred = Q.defer();
	mysql.query("SELECT game.id FROM `game` WHERE date_time < NOW() AND live=1 ORDER BY date_time DESC LIMIT 1")
	.then(function(result) {
		return game(result[0].id, userId);
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

var games = function() {
	var deferred = Q.defer();
	var games = [];
	mysql.query("SELECT game.*, country.name AS country_name, country_game.score, UNIX_TIMESTAMP(game.date_time) AS utime, venue.name AS venue_name, venue.city FROM `game` JOIN venue ON venue.id = game.venue_id JOIN country_game ON game.id = country_game.game_id JOIN country ON country_game.country_id = country.id ORDER BY game.date_time DESC")
	.then(function(result) {
		// console.log(result);
		result.forEach(function(game) {
			var tmp = games.find(function(g) {
				return g.id == game.id;
			});
			if (!tmp) {
				game.countries = [{ name: game.country_name, score: game.score }];
				game.utime = moment(game.utime * 1000).tz("Africa/Johannesburg").format("ddd d MMM YYYY");
				games.push(game);
			} else {
				tmp.countries.push({ name: game.country_name, score: game.score });
			}
		});
		deferred.resolve(games);
	}, function(err) {
		deferred.reject(err);
	});
	return deferred.promise;
}

module.exports = {
	game: game,
	latestGame: latestGame,
	games: games
}