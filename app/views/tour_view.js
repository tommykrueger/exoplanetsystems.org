var View = require('./view');

module.exports = View.extend({

	id: 'tour',
  template: require('./templates/tour'),

  initialize: function( options ){
  	this.app = options.app;
    this.render();
		_.bindAll(this, 'render', 'update');
  },

  render: function(){
    this.$el.html(this.template());
    this.$el.find('.distance').hide();

    $('body').append(this.$el);
  },

  update: function(){
    var self = this;
    var distance = self.app.currentDistanceLY;

    this.$el.hide();
    this.$el.find('.distance').hide();

    if (distance <= 1) {
      this.$el.find('.distance-1').show();
      this.$el.show();
    }

    if (distance <= 25 && distance > 1) {
      this.$el.find('.distance-10').show();
      this.$el.show();
    }

    if (distance <= 100000 && distance > 1000) {
      this.$el.find('.distance-1000').show();
      this.$el.show();
    }    
  }

});