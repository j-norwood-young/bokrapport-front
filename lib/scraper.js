var request = require("request");
var cheerio = require("cheerio");
var q = require("q");

var Scrape = {
	fetch: function(url) {
		var deferred = q.defer();
		request(url, function(err, response, html) {
			if (err) {
				deferred.reject(err);
				return;
			}
			deferred.resolve(html.toString());
		});
		return deferred.promise;
	}
}

module.exports = Scrape;