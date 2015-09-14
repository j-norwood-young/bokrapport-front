var express = require('express');
var router = express.Router();
var cheerio = require("cheerio");
var moment = require("moment");

var fs = require("fs");

var scraper = require("../lib/scraper");

var mysql = require("../lib/mysql");

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get("/players", function(req, res, next) {
	function shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex ;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
		}

		return array;
	}
	var data_map = {
		"Full Name": "firstname",
		"Surname": "surname",
		"Height": "height",
		"Weight": "weight",
		"Birth Date": "birth_date",
		"Birth Place": "birth_place",
		"Maritial Status": "marital_status",
		"Favourite Film": "favourite_film",
		"Favourite Music": "favourite_music",
		"Favourite Food": "favourite_food",
		"Primary School": "primary_school",
		"Secondary School": "secondary_school",
		"Tertiary Education": "tertiary_education",
		"Province": "province"
	}
	var url = "http://www.sarugby.net/index.php?option=com_players&view=record&name=capped";
	scraper.fetch(url)
	.then(function(result) {
		var player_urls = [];
		var player_common_names = {};
		var $ = cheerio.load(result);
		var rows = $(".table-width-full").find("tr");
		// console.log(rows);
		rows.each(function(i, row) {
			player_urls.push($(this).find("td").find("a").attr("href"));
			player_common_names[$(this).find("td").find("a").attr("href")] = $(this).find("td").find("a").html();
		});
		player_urls.shift();
		console.log("Player count", player_urls.length);
		// player_urls = shuffle(player_urls);
		mysql.query("SELECT * FROM player WHERE last_scrape > now() - INTERVAL 1 DAY")
		.then(function(result) {
			for(var i = 0; i < player_urls.length; i++) {
				result.forEach(function(player) {
					if (player.saru_url == player_urls[i]) {
						player_urls.splice(i, 1);
					}
				});
			}
			console.log("Remainging player count", player_urls.length);
			player_urls = player_urls.slice(0, 3);
			var worker = setInterval(function() {
				if (!player_urls.length) {
					clearInterval(worker);
					return false;
				}
				var player_url = player_urls.shift();
				mysql.getOne("player", { saru_url: player_url })
				.then(function(result) {
					var isUpdate = false;
					if (result) {
						isUpdate = result.id;
						// return true;
					}
					console.log("Fetching", player_url);
					scraper.fetch("http://www.sarugby.net" + player_url)
					.then(function(player_html) {
						var $ = cheerio.load(player_html);
						var stats = {}
						stats.saru_url = player_url;
						stats.last_scrape = new Date();
						$(".player-single-summary").find("tr").each(function(i, row) {
							if (data_map[$(this).find("td").first().text().trim()]) {
								stats[data_map[$(this).find("td").first().text().trim()]] = $(this).find("td").last().text().trim();
							}
						});
						try {
							stats.birth_date = moment(stats.birth_date, "D MMM YYYY").format("YYYY-MM-DD");
						} catch(e) {
							console.log(e);
							stats.birth_date = 0;
						}
						stats.weight = parseInt(stats.weight);
						stats.position = $(".player-career-rugby").find("table").first().find("tr").next().find("td").next().html().trim();
						stats.province = $(".player-career-rugby").find("table").first().find("tr").next().next().find("td").next().html().trim();
						// stats.photo = $(".player-single-img").find("img").attr("src");
						stats.caps = $(".player-career-springbok").find("table").first().find("tr").next().find("td").next().html().trim();
						stats.common_name = player_common_names[player_url];
						console.log(stats);
						if (isUpdate) {
							console.log("Updating", result.firstname + " " + result.surname);
							mysql.update("player", { id: isUpdate }, stats);
						} else {
							console.log("Inserting", result.firstname + " " + result.surname);
							mysql.insert("player", stats);
						}
					});
				}, function(err) {
					console.log("Error", err);
				})
				
			}, 2000);
		});
		// player_urls.forEach(function(player_url) {
		// 	console.log("Fetching", player_url)
		// 	scraper.fetch("http://www.sarugby.net" + player_url)
		// 	.then(function(player_html) {
		// 		var $ = cheerio.load(player_html);
		// 		$(".player-single-summary").find("tr").each(function(i, row) {
		// 			var key = $(this).find("td").first().text();
		// 			var val = $(this).find("td").last().text();
		// 			console.log(key, val);
		// 		});

		// 	})
		// })
		res.send(player_urls);
	})
	.then(null, function(err) {
		res.render("error", { error: err });
	});
});

router.get("/fixtures", function(req, res) {
	var fixtures = JSON.parse(fs.readFileSync("./data/fixtures.json"));
	var evt = null;
	var countries = [];
	//Get all the countries for ease of looking up
	mysql.get("country")
	.then(function(result) {
		countries = result;
		console.log(countries);
		return mysql.getOne("event", { name: fixtures.event.label });
	})
	.then(function(evt) {
		if (!evt) { //Event missing, insert
			return mysql.insert("event", { name: fixtures.event.label, start_date: fixtures.event.start.label, end_date: fixtures.event.end.label }).then(function(id) {
				return mysql.getOne("event", { id: id });
			});
		}
		return evt;
	})
	.then(function(result) {
		evt = result;
		fixtures.matches.forEach(function(match) {
			mysql.getOne("venue", { name: match.venue.name })
			.then(function(venue) {
				if (!venue) { //Venue missing, insert
					// console.log("Venue missing");
					var country = countries.find(function(country) {
						return (country.name == venue.country.name);
					});
					// console.log("Country", country);
					return mysql.insert("venue", { name: match.venue.name, city: match.venue.city,  country_id: country.id }).then(function(id) {
						return mysql.getOne("venue", { id: id });
					});
				}
				return venue;
			})
			.then(function(venue) {
				var team1 = countries.find(function(country) {
					return (country.name == match.teams[0].name);
				});
				var team2 = countries.find(function(country) {
					return (country.name == match.teams[1].name);
				});
				console.log(team1, team2, venue);
			})
		})
		// res.send(evt);
	});
	
	res.send(fixtures);
});

module.exports = router;