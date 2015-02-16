var View = require('./view');

module.exports = View.extend({

	id: null,
  template: require('./templates/tooltip'),

  initialize: function( options ){
  	this.pos = options.pos;
  	this.model = options.data;

  	this.render();

		_.bindAll(this, 'render');
  },

  render: function() {
  	var self = this;

  	$('#tooltip').css({
  		top: self.pos.y + 12,
  		left: self.pos.x + 12
  	});

  	$('#tooltip').show();
  	$('#tooltip').html(self.template(self.model));
  }

});