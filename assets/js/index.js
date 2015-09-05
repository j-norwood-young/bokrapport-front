var jquery = require("jquery");

$(function() {
	
	$(".slider").each(function() {
		// console.log(this);
		var top = $(this).css("margin-top");
		var left = $(this).position().left;
		var maxx = $(this).parent().width() - $(this).width();
		var id = $(this).data("id");
		console.log(left, maxx);
		new Draggable(this, {
			limit: {
				y: top,
				x: [left, maxx  + left]
			},
			onDrag: function(el, x) {
				console.log("x", x, "left", left, "maxx", maxx, "result", x/maxx);
				$("#user_rating_" + id).html(Math.round((x - left) / maxx * 10));
			}
		});
	})
	
})