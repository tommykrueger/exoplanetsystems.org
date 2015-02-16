var View = require('./view');

module.exports = View.extend({

	id: 'search-list',
	tagName: 'ul',
  template: require('./templates/search-list'),

  events: {
    'click li': 'itemClicked'
  },

  initialize: function( options ){
  	this.app = options.app;
    this.model = options.model;

  	_.bindAll(this, 'render', 'itemClicked');
  },

  render: function(){
  	console.log(this.model);
  	this.$el.html(this.template(this.model));
  	return this;
  },

  itemClicked: function(e){
    var id = $(e.currentTarget).attr('rel').replace('system-', '');
    this.app.addSystem(id);
  }

});