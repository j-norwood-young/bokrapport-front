// var jquery = require("jquery");
var Q = require("q");

function hasLocalStorage() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}

$(function() {
	var facebook_id = null;
	//Draggable Slider
	var draggables = [];
	var makeSlider = function(sender) {
		var self = this;
		var offset = 0;
		console.log(self);
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
				$(self).data("val", val);
				$("#user_rating_" + id).html(val);
			},
			onDragEnd: function(el, x) {
				var val = Math.round((x - left) / maxx * 10);
				var gameId = $("#game_data").data("game-id");
				if (hasLocalStorage()) {
					localStorage.setItem("rating-" + gameId + "." + id, val);
				}
				$.post("/api/rate", { game_id: gameId, player_id: id, rating: val })
				.then(function(result) {
					return $.get("/api/rating/avg/" + gameId + "/" + id);
				})
				.then(function(result) {
					console.log($("#avg_rating_" + result.player_id));
					$("#avg_rating_" + result.player_id).html(result.rating);
					console.log(result);
				});
			}
		}).set(left + offset, top);
		draggables.push(draggable);
	}

	var setSlider = function(self, val) {
		console.log(self);
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
			console.log("Checking slider", gameId, id);
			var val = 0;
			if (hasLocalStorage()) {
				val = localStorage.getItem("rating-" + gameId + "." + id);
				if (val) {
					$("#user_rating_" + id).html(val);
					setSlider(self, val);
					return;
				}
			}
			$.get("/api/rating/avg/" + gameId + "/" + id)
			.then(function(result) {
				if (val) {
					$("#user_rating_" + id).html(val);
					// makeSlider(self);
					return;
				}
			});
		});
	}

	$(window).on("resize", makeSliders);

	makeSliders();
	setVals();	
	
	//Facebook
	window.fbAsyncInit = function() {
		FB.init({
			appId      : '882901835078866',
			xfbml      : true,
			version    : 'v2.4'
		});
		//FB Login
		FB.getLoginStatus(function(response) {
			if (response.status === 'connected') {
				console.log('Logged in.', response);
				console.log(response);
				userId = response.authResponse.userId;
				afterLogin();
			}
			// fbLogin();
		});
	};

	var afterLogin = function() {
		FB.api('/me?fields=id,first_name,last_name,picture,email', function(response) {
			$.post("/api/login", { firstname: response.first_name, surname: response.last_name, picture: response.picture.data.url, facebook_id: response.id, email: response.email })
			.then(function(result) {
				$(window).data("userId", result.id);
			});
		});
		FB.api('me/friends', function(response) {
			console.log("Friends", response);
		})
	}

	var fbLogin = function() {
		
		if (!userId) {
			FB.login(function(response) {
				facebook_id = response.authResponse.userId;
				afterLogin();
			}, { scope: 'user_friends' });
			return;
		}
		afterLogin();
	}

	// $(".fb-btn").on("click", function() {
	// 	if (!userId) {
	// 		fbLogin();
	// 		return;
	// 	}

	// });
});





(function(d, s, id){
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement(s); js.id = id;
	js.src = "//connect.facebook.net/en_US/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

$(function() {
	
});