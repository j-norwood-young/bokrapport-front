// var jquery = require("jquery");
var Q = require("q");
var utils = require("./utils");

$(function() {
	//Draggable Slider
	var draggables = [];
	var makeSlider = function(sender) {
		var self = this;
		var offset = 0;
		// console.log(self);
		var width = $(self).width();
		var maxx = $(self).parent().width() - width;
		$(self).css("left", $(self).parent().position().left);
		var top = $(self).css("margin-top");
		var left = $(self).position().left;
		var id = $(self).data("id");
		if ($(self).data("val")) {
			offset = Math.round(maxx / 10 * $(self).data("val"));
		}
		// console.log(left, maxx);
		var draggable = new Draggable(self, {
			limit: {
				y: top,
				x: [left, maxx  + left]
			},
			onDrag: function(el, x) {
				var val = Math.round((x - left) / maxx * 10);
				$(self).data("val", val );
				$("#user_rating_" + id).html((val) ? val : "?");
			},
			onDragEnd: function(el, x) {
				var val = Math.round((x - left) / maxx * 10);
				var gameId = $("#game_data").data("game-id");
				if (utils.hasLocalStorage()) {
					localStorage.setItem("rating-" + gameId + "." + id, val);
				}
				$.post("/api/rate", { game_id: gameId, player_id: id, rating: val })
				.then(function(result) {
					// if (ws) {
					// 	ws.send(JSON.stringify({
					// 		isVote: true,
					// 		game_id: gameId,
					// 		player_id: id,
					// 		rating: val,
					// 		user_id: userId,
					// 		picture: picture
					// 	}));
					// }
					$("#dankie_" + id).hide().removeClass("hide").slideDown("slow").delay(1500).slideUp('slow');
					result.players.forEach(function(player) {
						$("#avg_rating_" + player.id).html(Math.round(player.avg_rating));
					});
				});
			}
		}).set(left + offset, top);
		draggables.push(draggable);
	}

	var setSlider = function(self, val) {
		// console.log(self);
		var width = $(self).width();
		var maxx = $(self).parent().width() - width;
		offset = Math.round(maxx / 10 * val);
		var left = $(self).parent().position().left;
		$(self).css("left", left + offset);
	}

	var makeSliders = function() {
		draggables = [];
		$(".slider").each(makeSlider);
	}

	var setVals = function() {
		$(".slider").each(function() {
			var self = this;
			var gameId = $("#game_data").data("game-id");
			var id = $(this).data("id");
			// console.log("Checking slider", gameId, id);
			var val = 0;
			if (utils.hasLocalStorage()) {
				val = localStorage.getItem("rating-" + gameId + "." + id);
				if (val) {
					$("#user_rating_" + id).html(parseInt(val) ? val : "?");
					setSlider(self, val);
					return;
				}
			}
			$.get("/api/rating/avg/" + gameId + "/" + id)
			.then(function(result) {
				if (val) {
					$("#user_rating_" + id).html(parseInt(val) ? val : "?");
					// makeSlider(self);
					return;
				}
			});
		});
	}

	$(window).on("resize", makeSliders);

	makeSliders();
	setVals();

	var ws = null;
	var x =0;
	//Websocket
	// if (gameId) {
	// 	console.log("Trying to open socket");
	// 	ws = new WebSocket("ws://bokrapport.dev:3111/game/" + gameId);
	// 	ws.onmessage = function(ev) {
	// 		try {
	// 			var data = JSON.parse(ev.data);
	// 			console.log(data);
	// 			if (data.player_id) {
	// 				console.log("Caught player", data.player_id);
	// 				var playerEl = $("#player_" + data.player_id);
	// 				playerEl.find(".avg_rating > .rating-description").find("[data-user-id=" + data.user_id + "]").remove();
	// 				playerEl.find(".avg_rating > .rating-description > .profilePic").slice(0, -4).remove();
	// 				if (data.rating) {
	// 					if (data.picture) {
	// 						var s = "<div class='profilePic' data-user-id='" + data.user_id + "' style='background-image: url(" + data.picture + ")'>" + data.rating + "</div>";
	// 					} else {
	// 						var s = "<div class='profilePic' data-user-id='" + data.user_id + "'>" + data.rating + "</div>";
	// 					}
	// 					playerEl.find(".avg_rating > .rating-description").append(s);
	// 				}
	// 			}
	// 		} catch(e) {
	// 			console.log("Not JSON, ignoring");
	// 		}
	// 	};
	// }
});

// Google Analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-18329512-3', 'auto');
ga('send', 'pageview');

// Facebook
(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/af_ZA/sdk.js#xfbml=1&version=v2.4&appId=882901835078866";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));