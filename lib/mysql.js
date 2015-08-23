var mysql = require("mysql");
var config = require("../config");
var Q = require("q");

// Mysql
var pool = mysql.createPool(config.mysql);

var getConnection = function() {
	var deferred = Q.defer();
	pool.getConnection(function(err, conn) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(conn);
		}
	});
	return deferred.promise;
}

var prepFields = function(vals) {
	var s = [];
	var v = [];
	for(key in vals) {
		s.push(key + " = ?");
		v.push(vals[key]);
	}
	return { vals: v, keys: s, keysql: s.join(", ") };
}

module.exports = MySql = {
	query: function(query, fields) {
		var deferred = Q.defer();
		getConnection()
		.then(function(connection) {
			connection.query(query, fields, function(err, data) {
				if (err) {
					deferred.reject(err);
				} else {
					if (data.length) {
						deferred.resolve(data[0]);
					} else {
						deferred.resolve(false);
					}
				}
			});
			connection.release();
		});
		return deferred.promise;
	},
	getOne: function(table, vals) {
		var deferred = Q.defer();
		console.log(typeof vals);
		if (typeof vals !== "object") {
			vals = { id: vals }
		}
		var fields = prepFields(vals);
		console.log(mysql.format("SELECT * FROM " + table + " WHERE " + fields.keysql, fields.vals));
		this.query("SELECT * FROM " + table + " WHERE " + fields.keysql, fields.vals)
		.then(function(result) {
			deferred.resolve(result);
		}, function(err) {
			deferred.reject(err);
		});
		return deferred.promise;	
	},
	insert: function(table, vals) {
		return this.query("INSERT INTO users SET ?", vals);
	},
	update: function(table, id, vals) {
		var fields = prepFields(vals);
		fields.vals.push(id);
		var sql = mysql.format("UPDATE " + table + " SET " + fields.keysql + " WHERE id = ?", fields.vals);
		console.log(sql);
		return this.query(sql);
	}
}

exports.format = mysql.format;