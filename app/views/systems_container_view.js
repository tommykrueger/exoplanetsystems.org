var View = require('./view');

var PopupView = require('./popup_view');

module.exports = View.extend({

	id: 'systems-controls',
  template: require('./templates/systems'),

  events: {
    'click .system': 'showSystemInfo',
    'click .system-setting': 'toggleSystemSetting',
  },

  initialize: function( options ){
    this.app = options.app;
    this.model = options.data;

    this.data = {
      systems: []
    };

    for (var i in this.model) {
      console.log(this.model[i]);
      this.data.systems.push( this.model[i].model );
    }

    this.render();

  	_.bindAll(this, 
      'afterRender', 
      'showSystemInfo', 
      'updateSystemSettings',
      'toggleSystemSetting'
    );
  },

  render: function() {
    this.$el.html(this.template(this.data));
    this.afterRender();
    return this;
  },

  afterRender: function(){
    $('#interface').append(this.$el);
    this.$el.show();
  },

  showSystemInfo: function(e){
    var self = this;
    var el = $(e.currentTarget);

    el.find('system-content').toggle();
  },

  updateSystemSettings: function(e){
    var self = this;
    var el = $(e.currentTarget);
    var type = el.attr('type');
    var system = el.attr('system');

    console.log(el);

  },

  toggleSystemSetting: function(e){
    var self = this;
    var el = $(e.currentTarget);
    var type = $(el).attr('type');
    var systemName = $(el).parent().attr('system');

    $(el).toggleClass('active');

    _.each(self.model, function(model){
      if (model.name == systemName) {
        
        if (type == 'planets') {
          _.each( model.meshes, function( mesh, idx ) {
            if (mesh.visible == true)
              mesh.visible = false;
            else
              mesh.visible = true;
          });
        }

        if (type == 'orbits') {
          _.each( model.orbits, function( orbit, idx ) {
            if (orbit.line) {
              if (orbit.line.material.opacity == 0.0)
                orbit.line.material.opacity = window.settings.orbitTransparency;
              else
                orbit.line.material.opacity = 0.0;  
            }
          });
        }

        if (type == 'labels') {
          $('#labels .planetsystem-' + model.name.replace(' ', '').toLowerCase() ).toggle();
        }

        if (type == 'habitable') {
          if (model.habitableZone.visible == false)
            model.habitableZone.visible = true;
          else
            model.habitableZone.visible = false;
        }

        if (type == 'inclination') {

          _.each( model.meshes, function( mesh, idx ) {
            if (mesh.parent.parent.parent.rotation.x == 0)
              mesh.parent.parent.parent.rotation.x = parseFloat(mesh.parent.parent.parent.inclination) * Math.PI/180;
            else
              mesh.parent.parent.parent.rotation.x = 0;
          });

        }

      }
    });
  }

});