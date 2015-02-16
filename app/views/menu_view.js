var View = require('./view');

var PopupView = require('./popup_view');
var SystemsContainerView = require('./systems_container_view');

module.exports = View.extend({

	id: 'mainmenu',
  template: require('./templates/menu'),

  events: {
  	'click .menu li': 'menuClicked'
  },

  initialize: function( options ){
    this.app = options.app;
  	this.type = options.type;
    this.model = options.structure;

    console.log(this.model);

  	_.bindAll(this, 'menuClicked');
  },

  render: function(){
    this.$el.html(this.template(this.model));
    return this;
  },

  menuClicked: function(event){
  	var self = this;
  	var id = $(event.currentTarget).attr('id');

  	switch(id) {
      case 'firmament-view': 
        var target = {
          x: window.settings.LY * 1000000000 / window.settings.distancePixelRatio,
          y: window.settings.LY * 1000000000 / window.settings.distancePixelRatio,
          z: window.settings.LY * 1000000000 / window.settings.distancePixelRatio 
        };
        self.app.config.distance.value = 1000000000;
        self.app.config.distance.type = 'ly';
        self.app.cameraHelper.bindObject = null;
        self.app.cameraHelper.moveTo(self.app.camera.position, target, 30000);
      break;
      case 'local-group-view': 
        var target = {
          x: window.settings.LY * 10000000 / window.settings.distancePixelRatio,
          y: window.settings.LY * 10000000 / window.settings.distancePixelRatio,
          z: window.settings.LY * 10000000 / window.settings.distancePixelRatio 
        };
        self.app.config.distance.value = 10000000;
        self.app.config.distance.type = 'ly';
        self.app.cameraHelper.bindObject = null;
        self.app.cameraHelper.moveTo(self.app.camera.position, target, 30000);
      break;
      case 'galaxy-view': 
        var target = {
          x: window.settings.LY * 10000 / window.settings.distancePixelRatio,
          y: window.settings.LY * 10000 / window.settings.distancePixelRatio,
          z: window.settings.LY * 10000 / window.settings.distancePixelRatio 
        };
        self.app.config.distance.value = 10000;
        self.app.config.distance.type = 'ly';
        self.app.cameraHelper.bindObject = null;
        self.app.cameraHelper.moveTo(self.app.camera.position, target, 5000);
      break;
      case 'star-view': 
        var target = {
          x: window.settings.LY * 100 / window.settings.distancePixelRatio,
          y: window.settings.LY * 100 / window.settings.distancePixelRatio,
          z: window.settings.LY * 100 / window.settings.distancePixelRatio 
        };
        self.app.config.distance.value = 100;
        self.app.config.distance.type = 'ly';
        self.app.cameraHelper.bindObject = null;
        self.app.cameraHelper.moveTo(self.app.camera.position, target, 5000);
      break;
      case 'planet-view': 
        var target = {
          x: window.settings.AU * 1 / window.settings.distancePixelRatio,
          y: window.settings.AU * 1 / window.settings.distancePixelRatio,
          z: window.settings.AU * 1 / window.settings.distancePixelRatio 
        };
        self.app.config.distance.value = 1;
        self.app.config.distance.type = 'au';
        self.app.cameraHelper.bindObject = null;
        self.app.cameraHelper.moveTo(self.app.camera.position, target, 5000);
      break;

      case 'search': 
        new PopupView({ app:self.app, template: 'search'});
      break;

      case 'systems': 
        if (window.systemsContainerView)
          window.systemsContainerView.$el.toggle();
        else
          window.systemsContainerView = new SystemsContainerView({ app:self.app, data: self.app.systems});
      break;

      case 'fullscreen': 
        if (THREEx.FullScreen.activated())
          THREEx.FullScreen.cancel();
        else
          THREEx.FullScreen.request();
      break;

      case 'settings': 
        new PopupView({ app:self.app, template: 'settings'});
      break;

      case 'view-2d': 
        self.app.cameraHelper.bindObject = null;
        self.app.cameraHelper.moveTo(
          self.app.camera.position,
          {
            x: 0, 
            y: window.utils.makeDistance( self.app.config.distance.value, self.app.config.distance.type ), 
            z: 0
          }
        );
      break;

      case 'view-3d': 
        self.app.cameraHelper.bindObject = null;
        self.app.cameraHelper.moveTo(
          self.app.camera.position,
          {
            x: window.utils.makeDistance( self.app.config.distance.value, self.app.config.distance.type ),
            y: window.utils.makeDistance( self.app.config.distance.value, self.app.config.distance.type ),
            z: window.utils.makeDistance( self.app.config.distance.value, self.app.config.distance.type )
          }
        );
      break;

      case 'solarsystem': 
        if (self.app.config.settings.solarsystem === false) {
          self.app.config.settings.solarsystem = true;
          self.app.config.settings.habitable_zone = false;
          self.app.config.settings.inclination = true;
          self.app.addSolarSystem();
        }
      break;
  	}

  }


});