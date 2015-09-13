var express = require('express');
var router = express.Router();
var mysql = require("../lib/mysql");
var moment = require("moment-timezone");
var gameModel = require("../models/games");

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
	var games = null;
	var game = null;
	gameModel.latestGame(req.session.userId)
	.then(function(result) {
		game = result;
		res.locals.game_id = result.game.id;
		return gameModel.games();
	})
	.then(function(result) {
		games = result;
		game.games = games;
		res.render("index", game);
	})
	.then(null, function(err) {
		console.log("Error", err);
	});
	// res.render('index', { title: 'BokRapport' });
});

router.get("/game/:id", function(req, res, next) {
	var games = null;
	var game = null;
	console.log("User", req.user);
	gameModel.game(req.params.id, req.session.userId)
	.then(function(result) {
		game = result;
		res.locals.game_id = result.game.id;
		// console.log(game);
		return gameModel.games();
	})
	.then(function(result) {
		games = result;
		game.games = games;
		res.render("index", game);
	})
	.then(null, function(err) {
		console.log("Error", err);
	});
});

router.get("/game/:id/user/:userId", function(req, res, next) {
	var games = null;
	var game = null;
	var showUser = null;
	mysql.getOne("user", { id: req.params.userId})
	.then(function(result) {
		showUser = result;
	})
	gameModel.game(req.params.id, req.session.userId)
	.then(function(result) {
		game = result;
		res.locals.game_id = result.game.id;
		// console.log(game);
		return gameModel.games();
	})
	.then(function(result) {
		games = result;
		game.games = games;
		game.showUser = showUser;
		res.render("user_game", game);
	})
	.then(null, function(err) {
		console.log("Error", err);
	});
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
