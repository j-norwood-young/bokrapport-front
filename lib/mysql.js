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

var prepFields = function(vals, join) {
	join = join || ",";
	var s = [];
	var v = [];
	for(key in vals) {
		s.push(key + " = ?");
		v.push(vals[key]);
	}
	return { vals: v, keys: s, keysql: s.join(" " + join + " ") };
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
					deferred.resolve(data);
				}
			});
			connection.release();
		}, function(err) {
			deferred.reject(err);
		});
		return deferred.promise;
	},
	get: function(table, vals) {
		var deferred = Q.defer();
		if (!vals) {
			this.query("SELECT * FROM " + table)
			.then(function(result) {
				deferred.resolve(result);
			}, function(err) {
				deferred.reject(err);
			});
		} else {
			if (typeof vals !== "object") {
				vals = { id: vals }
			}
			var fields = prepFields(vals);
			this.query("SELECT * FROM " + table + " WHERE " + fields.keysql, fields.vals)
			.then(function(result) {
				deferred.resolve(result);
			}, function(err) {
				deferred.reject(err);
			});
		}
		return deferred.promise;
	},
	getOne: function(table, vals) {
		var deferred = Q.defer();
		if (typeof vals !== "object") {
			vals = { id: vals }
		}
		var fields = prepFields(vals, "AND");
		console.log(mysql.format("SELECT * FROM " + table + " WHERE " + fields.keysql + " LIMIT 1", fields.vals));
		this.query("SELECT * FROM " + table + " WHERE " + fields.keysql + " LIMIT 1", fields.vals)
		.then(function(result) {
			// console.log("Result", result);
			deferred.resolve(result[0]);
		}, function(err) {
			deferred.reject(err);
		});
		return deferred.promise;
	},
	insert: function(table, vals) {
		var deferred = Q.defer();
		var sql = mysql.format("INSERT INTO " + table + " SET ?", vals);
		this.query(sql)
		.then(function(result) {
			console.log("Result", result)
			deferred.resolve(result.insertId);
		}, function(err) {
			deferred.reject(err);
		});
		return deferred.promise;
	},
	update: function(table, id, vals) {
		var fields = prepFields(vals);
		var where = prepFields(id, "AND");
		// console.log("Fields", fields);
		// console.log("Where", where);
		var sql = mysql.format("UPDATE " + table + " SET " + fields.keysql, fields.vals);
		sql += mysql.format(" WHERE " + where.keysql, where.vals);
		// console.log(sql);
		return this.query(sql);
	},
	upsert: function(table, id, vals) {
		var deferred = Q.defer();
		var self = this;
		console.log(table, id);
		this.getOne(table, id)
		.then(function(result) {
			if (!result) {
				// console.log("Inserting", table, vals);
				return self.insert(table, vals);
			} else {
				return self.update(table, { id: result.id }, vals);
			}
		})
		.then(function(result) {
			return self.getOne(table, id);
		})
		.then(function(result) {
			deferred.resolve(result);
		})
		.then(null, function(err) {
			deferred.reject(err);
		});
		return deferred.promise;
	},
	remove: function(table, vals, nolimit) {
		var deferred = Q.defer();
		if (typeof vals !== "object") {
			vals = { id: vals }
		}
		var fields = prepFields(vals, "AND");
		var limit = (nolimit) ? "" : " LIMIT 1";
		console.log(mysql.format("DELETE FROM " + table + " WHERE " + fields.keysql + limit, fields.vals));
		this.query("DELETE FROM " + table + " WHERE " + fields.keysql + limit, fields.vals)
		.then(function(result) {
			deferred.resolve(result);
		}, function(err) {
			deferred.reject(err);
		});
		return deferred.promise;
	}
}

exports.format = mysql.format;