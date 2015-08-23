var rest = require('restler-q');
var config = require('../config');
var Q = require('q');

var social = {
	auth: function(provider) {
		if (!config.oauth[provider]) {
			throw error({ message: provider + " not configured"});
			return;
		}
		var provider_config = config.oauth[provider];
		csrf = Math.random().toString(36).substring(7);
		var uri = provider_config.auth_uri + "?client_id=" + provider_config.app_id + "&redirect_uri=" + config.base_url + "/oauth/callback/" + provider + "&scope=" + provider_config.scope + "&state=" + csrf + "&response_type=code";
		return { uri: uri, csrf: csrf };
	},
	callback: function(provider, code) {
		var q = Q.defer();
		if (!config.oauth[provider]) {
			q.reject({ message: provider + " not configured"});
			return;
		}
		var provider_config = config.oauth[provider];
		var token = false;
		if (!code) {
			q.reject({ error: "Could not authenticate with " + provider});
			return;
		}
		rest.post(provider_config.token_uri, { data: { client_id: provider_config.app_id, redirect_uri: config.base_url + "/oauth/callback/" + provider, client_secret: provider_config.app_secret, code: code, grant_type: "authorization_code" } })
		.then(function(result) {
			console.log("Got token");
			token = result;
			return rest.get(provider_config.api_uri, { accessToken: token.access_token });
		})
		.then(function(result) {
			console.log("Got API response", result);
			result.token = token;
			q.resolve(result);
		}, function(err) {
			q.reject({ message: err.error.message || "Something went wrong", error: err});
		});
		return q.promise;
	}
}

module.exports = social;