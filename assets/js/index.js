// var jquery = require("jquery");
var Q = require("q");
var utils = require("./utils");
var Base64Binary = require("./base64binary");
var chroma = require("chroma-js");

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


// Canvas
$(function() {
	// (function(d, s, id) {
	// 	var js, fjs = d.getElementsByTagName(s)[0];
	// 	if (d.getElementById(id)) return;
	// 	js = d.createElement(s); js.id = id;
	// 	js.src = "//connect.facebook.net/en_US/all.js";
	// 	fjs.parentNode.insertBefore(js, fjs);
	// }(document, 'script', 'facebook-jssdk'));

	// window.fbAsyncInit = function() {
	// 	FB.init({
	// 		appId  : "882901835078866",
	// 		status : true, 
	// 		cookie : true, 
	// 		xfbml  : true  // parse XFBML
	// 	});
	// };
	//https://github.com/lukasz-madon/heroesgenerator

	// from: http://stackoverflow.com/a/5303242/945521
	if ( XMLHttpRequest.prototype.sendAsBinary === undefined ) {
		XMLHttpRequest.prototype.sendAsBinary = function(string) {
			var bytes = Array.prototype.map.call(string, function(c) {
				return c.charCodeAt(0) & 0xff;
			});
			this.send(new Uint8Array(bytes).buffer);
		};
	};

	function postImageToFacebook( authToken, filename, mimeType, imageData, message ) {
		$("#pleaseWait").css("display", "block");
		$("#shareModal").modal("hide");
		// this is the multipart/form-data boundary we'll use
		var boundary = '----ThisIsTheBoundary1234567890';   
		// let's encode our image file, which is contained in the var
		var formData = '--' + boundary + '\r\n'
		formData += 'Content-Disposition: form-data; name="source"; filename="' + filename + '"\r\n';
		formData += 'Content-Type: ' + mimeType + '\r\n\r\n';
		for ( var i = 0; i < imageData.length; ++i ) {
			formData += String.fromCharCode( imageData[ i ] & 0xff );
		}
		formData += '\r\n';
		formData += '--' + boundary + '\r\n';
		formData += 'Content-Disposition: form-data; name="message"\r\n\r\n';
		formData += message + '\r\n'
		formData += '--' + boundary + '--\r\n';
		var xhr = new XMLHttpRequest();
		xhr.open( 'POST', 'https://graph.facebook.com/me/photos?access_token=' + authToken, true );
		xhr.onload = xhr.onerror = function() {
			console.log( xhr.responseText );
			console.log("Sent to Facebook");
			$("#pleaseWait").css("display", "none");
		};
		xhr.setRequestHeader( "Content-Type", "multipart/form-data; boundary=" + boundary );
		xhr.sendAsBinary( formData );
	};

	var canvas = document.getElementById("gameCanvas");

	function postCanvasToFacebook() {
		console.log("Posting to FB");
		var msg = $("#message").val();
		var data = document.getElementById("gameCanvas").toDataURL("image/jpeg");
		console.log(data);
		var encodedPng = data.substring(data.indexOf(',') + 1, data.length);
		// $("#preview").attr("src", data);
		var decodedPng = Base64Binary.decode(encodedPng);
		postImageToFacebook(accessToken, "bokrapport", "image/png", decodedPng, msg + "\nhttp://bokrapport.com");
		

		// FB.getLoginStatus(function(response) {
		// 	if (response.status === "connected") {
		// 		postImageToFacebook(response.authResponse.accessToken, "bokrapport", "image/png", decodedPng, "bokrapport.com");
		// 	} else if (response.status === "not_authorized") {
		// 		FB.login(function(response) {
		// 			postImageToFacebook(response.authResponse.accessToken, "bokrapport", "image/png", decodedPng, "bokrapport.com");
		// 		}, {scope: "publish_stream"});
		// 	} else {
		// 		FB.login(function(response)  { 
		// 			postImageToFacebook(response.authResponse.accessToken, "bokrapport", "image/png", decodedPng, "bokrapport.com");
		// 		}, {scope: "publish_stream"});
		// 	}
		// });
	};

	$("#postFB").on("click", postCanvasToFacebook);

	$("#showFB").on("click", function() {
		$("#shareModal").modal("show");
	})

	function wrapText(context, text, x, y, maxWidth, lineHeight) {
		var words = text.split(' ');
		var line = '';
		for(var n = 0; n < words.length; n++) {
			var testLine = line + words[n] + ' ';
			var metrics = context.measureText(testLine);
			var testWidth = metrics.width;
			if (testWidth > maxWidth && n > 0) {
				context.fillText(line, x, y);
				line = words[n] + ' ';
				y += lineHeight;
			} else {
				line = testLine;
			}
		}
		context.fillText(line, x, y);
	}

	var gutter = 8;
	var gutterY = 55;
	var perRow = 5;
	var size = 100;
	var offsetY = 120;
	var green = "#2e5b2d";
	var yellow = "#eac004";
	var red = "#e43940";
	var context = canvas.getContext("2d", {alpha: false});
	var bg = new Image();
	bg.src = "/images/fbbg.jpg";
	bg.onload = function() {
		context.drawImage(bg, 0, 0);
		// Heading
		var s = userName + " se BokRapport vir " + $(".teams").text();
		context.font = "normal 16px sans-serif";
		context.fillStyle = "#000000";
		context.textBaseline = "top";
		context.fillText(s, 10, 5);

		var x = 0;
		var imgs = [];
		$(".player").each(function(player) {
			var playerEl = $(this);
			var name = $(this).find(".name").text().replace("(", " (");
			var src = $(this).find(".player-identity > img").attr("src");
			var img = new Image();
			img.src = src;
			img.onload = function() {
				var offsetX = gutter + (x * (size + gutter));
				//Score
				var val = playerEl.find(".user_rating > .rating").text();
				var colour = "#666";
				var scale = chroma.scale([red, green]);
				if (parseInt(val)) {
					colour = scale(val / 10).hex();
				}
				context.beginPath();
				context.arc(offsetX + 18, offsetY + 32, 20, 0, Math.PI * 2, false);
				context.fillStyle = colour;
				context.fill();
				context.font = "normal 30px sans-serif";
				context.fillStyle = "#ffffff";
				

				if (val == 10) {
					context.fillText(val, offsetX, offsetY + 15);
				} else {
					context.fillText(val, offsetX + 10, offsetY + 15);
				}

				// Image
				context.drawImage(img, offsetX, offsetY, size, size);
				// Name block
				context.fillStyle = "#eac004";
				context.fillRect(offsetX, offsetY + size, size, 40);
				// Name
				context.font = "normal 12px PlayfairDisplay";
				context.fillStyle = "#000";
				context.textBaseline = "top";
				wrapText(context, name, offsetX + 5, offsetY + size + 5, size - 10, 10);
				
				// context.closePath();

				
				
				//Get ready for next one
				x++;
				if (x % perRow == 0) {
					x = 0;
					offsetY = offsetY + size + gutterY;
				}
			}
		});
	}
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