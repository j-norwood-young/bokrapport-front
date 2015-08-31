var jquery = require("jquery");
$(function() {
	$(".rating").raty({
		number: 5,
		half: true,
		path: "images",
		hints: null,
		starOff: "bok3.png",
		starHalf: "bok2.png",
		starOn: "bok1.png"
	});
})