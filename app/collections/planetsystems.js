var Planetsystem = require('../models/planetsystem');
var Collection = require('./collection');

module.exports = Collection.extend({
  model: Planetsystem,
  url: 'data/planetsystems.json?time=' + Math.random(),

  initialize: function() {
    this.name = 'Planetsystem';
    this.data = [];

    _.bindAll(this, 'remove', 'update');
  },

  remove: function( node ) {
  	//this.data.push( node );
  },

  update: function( node ) {
  	console.log( this );
  }

});