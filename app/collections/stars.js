var Star = require('../models/star');
var Collection = require('./collection');

module.exports = Collection.extend({
  model: Star,
  url: 'data/stars.json?time=' + Math.random(),

  initialize: function() {
    this.name = 'Stars';
  }
});