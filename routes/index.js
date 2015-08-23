var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// Other routes - don't polute our app.js

var oauth = require('./oauth');
router.use('/oauth', oauth);

var users = require('./users');
router.use('/users', users);

module.exports = router;
