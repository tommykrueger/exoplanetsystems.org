var Constellation = require('../models/constellation');
var Collection = require('./collection');

module.exports = Collection.extend({
  model: Constellation,
  url: 'data/constellations.json',

  initialize: function() {
    this.name = 'Constellation';
    this.data = [];

    _.bindAll(this, 'update');
  },

  update: function( node ) {
  	console.log( this );
  }

});