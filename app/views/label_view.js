var View = require('./view');

var InfoboxView = require('views/infobox_view');

module.exports = View.extend({

	id: _.uniqueId(),
  tagName: 'span',
  className: 'space-label',
  template: null,

  events: {
    'click': 'labelClicked',
    'mouseenter': 'labelMouseEnter',
    'mouseleave': 'labelMouseLeave'
  },

  initialize: function( options ){
  	this.app = options.app;
    this.object = options.object,
  	this.data = options.data;
    this.planetsystem = options.planetsystem;

    this.currentOrbitColor = null;
    this.currentOrbitOpacity = null;

  	this.render();

  	_.bindAll(this, 'render', 'labelClicked', 'labelMouseEnter', 'labelMouseLeave');
  },

  render: function(){
  	var self = this;

  	// render the label as html object to prevent zooming with web gl
    var labelID = 'object-' + self.data.name.replace(' ', '-').toLowerCase();
        labelID = labelID.replace(' ', '-');

    self.$el.attr('id', labelID);
    self.$el.html(self.data.name);

    self.$el.addClass('labelgroup-' + self.app.systems.length);
    self.$el.addClass('planetsystem-' + this.planetsystem.name.replace(' ', '').toLowerCase() );
    self.$el.css({'color': '#' + window.settings.orbitColors[ self.app.systems.length ].toString(16) });

    return self;
  },

  labelClicked: function(){
    var self = this;
    self.infobox = new InfoboxView({
      app: self.app,
      object: self.object,
      data: self.data,
      template: 'planet-info'
    });
  },

  labelMouseEnter: function(e){
    var self = this;
    var name = $(e.currentTarget).attr('id').replace('object-', '');

    _.each( self.app.orbits, function( orbit, idx ) {
      if (orbit.name.toLowerCase() == name) {
        self.currentOrbitColor = orbit.line.material.color;
        self.currentOrbitOpacity = orbit.line.opacity;

        orbit.line.material.color = new THREE.Color( 0xffffff );
        orbit.line.opacity = 1.0;
      }
    });
  },

  labelMouseLeave: function(e) {
    var self = this;
    var name = $(e.currentTarget).attr('id').replace('object-', '');

    _.each( self.app.orbits, function( orbit, idx ) {
      if (orbit.name.toLowerCase() == name) {
        orbit.line.material.color = self.currentOrbitColor;
        orbit.line.opacity = self.currentOrbitOpacity;
      }
    });
  }

});