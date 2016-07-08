var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  var data = require('../data');
  res.render('index', {
      title: 'Amaze UI后台系统Examples',
      description: 'This is description',
      keywords: 'This is keywords',
      data: data
  });
});

module.exports = router;
