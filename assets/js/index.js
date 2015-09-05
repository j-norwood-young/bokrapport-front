var jquery = require("jquery");

$(function() {
	
	var draggables = [];

	var makeSliders = function() {
		console.log("makeSliders");
		draggables = [];
		$(".slider").each(function() {
			// console.log(this);
			$(this).css("left", $(this).parent().position().left);
			var top = $(this).css("margin-top");
			var left = $(this).position().left;
			var maxx = $(this).parent().width() - $(this).width();
			var id = $(this).data("id");
			// console.log(left, maxx);
			var draggable = new Draggable(this, {
				limit: {
					y: top,
					x: [left, maxx  + left]
				},
				onDrag: function(el, x) {
					// console.log("x", x, "left", left, "maxx", maxx, "result", x/maxx);
					$("#user_rating_" + id).html(Math.round((x - left) / maxx * 10));
				}
			});
			draggables.push(draggable);
		});
	}

	$(window).on("resize", makeSliders);

	makeSliders();
	
})