var jquery = require("jquery");

$(function() {
	
	var draggables = [];

	var makeSliders = function() {
		draggables = [];
		$(".slider").each(function() {
			var self = this;
			var offset = 0;
			var width = $(this).width();
			var maxx = $(this).parent().width() - width;
			
			$(this).css("left", $(this).parent().position().left);
			var top = $(this).css("margin-top");
			var left = $(this).position().left;
			
			var id = $(this).data("id");
			if ($(this).data("val")) {
				offset = Math.round(maxx / 10 * $(this).data("val"));
			}
			// console.log(left, maxx);
			var draggable = new Draggable(this, {
				limit: {
					y: top,
					x: [left, maxx  + left]
				},
				onDrag: function(el, x) {
					var val = Math.round((x - left) / maxx * 10);
					$(self).data("val", val);
					$("#user_rating_" + id).html(val);
				}
			}).set(left + offset, top);
			draggables.push(draggable);
		});
	}

	$(window).on("resize", makeSliders);

	makeSliders();
	
})