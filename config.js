var config = {
	secret: "LKJn(*&anI34588NJnk6987sdajkP(*Y",
	base_url: "http://bokrapport.dev:3100",
	// app_url: "http://app.liedjie.dev",
	oauth: {
		facebook: {
			app_id: "882901835078866",
			app_secret: "89bc5e9a90cc57b1fd94b897838af1d8",
			scope: "email,user_friends",
			auth_uri: "https://www.facebook.com/dialog/oauth",
			token_uri: "https://graph.facebook.com/v2.3/oauth/access_token",
			api_uri: "https://graph.facebook.com/me?fields=id,first_name,last_name,age_range,email,picture",
		},
	},
	mysql: {
		connectionLimit : 100, //important
		host: 'localhost',
		user: 'bokrapport',
		password: 'a4MDj5xdp4G5BHEB',
		database: 'bokrapport',
		debug: false
	}
}

module.exports = config;