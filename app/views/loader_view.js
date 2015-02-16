var View = require('./view');

module.exports = View.extend({

	id: 'loader',
  template: require('./templates/loader'),

  initialize: function( options ){
  	this.options = options;

  	_.bindAll(this, 'render');
  }

});