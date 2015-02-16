var application = require('application');
var App = require('lib/app');
var Shaders = require('lib/shaders');

// collections
var Constellations = require('collections/constellations');
var Stars = require('collections/stars');
var Planetsystems = require('collections/planetsystems');

// views
var MenuView = require('views/menu_view');
var AnimationControlsView = require('views/animation_controls_view');
var PopupView = require('views/popup_view');

module.exports = Backbone.Router.extend({

  routes: {
    '': 'index',
    ':planetsystem': 'index',
    'show/:planetsystem': 'displayPlanetsystem',
  },

  index: function ( planetSystem ) {
    console.log( planetSystem );

    var self = this;  

    console.log('initializing app');

    var stars = new Stars();
    var shaders = new Shaders();
    var planetsystems = new Planetsystems();
    var constellations = new Constellations();

    $.when(
      
      // stars.fetch(),
      shaders.fetch(),
      stars.fetch(),
      planetsystems.fetch(),
      constellations.fetch()

      ).done(function(){

        var app = new App({
          stars: stars,
          planetsystems: planetsystems,
          constellations: constellations,
          shaders: shaders.data,
          config: {
            distance: {
              type: 'au',
              value: 1
            }
          }
        });

        var menuView = new MenuView({ app: app, type: 'mainmenu' });
        var animationControlsView = new AnimationControlsView({ app: app });

        app.animationControlsView = animationControlsView;

        $('#interface').append(menuView.render().el);
        $('#interface').append(animationControlsView.render().el);

        window.app = app;

        app.afterRender();
    });    
  },

  displayPlanetsystem: function( systemName ){

    var systemName = systemName.trim().replace(' ', '-').toLowerCase();
    var planetsystems = new Planetsystems();
    var planetsystem = null;

    $.when( planetsystems.fetch() ).done(function(){

      // check if planetsystem exists
      var systemExists = false;
      _.each(planetsystems.models, function(system, id){

        var name = system.get('name').trim().replace(' ', '-').toLowerCase();
        if ( name == systemName ) {
          console.log('system found:', system);
          systemExists = true;
          planetsystem = system;
        }
      });

      if (!systemExists) {
        console.log('planet system not exists');
        //new PopupView({
          //template: 'planet-not-found'
        //});

      } else {

        var app = new App({
          stars: null,
          planetsystems: planetsystems,
          shaders: null,
          config: {
            distance: {
              type: 'au',
              value: 1
            },
            camera: {
              view: '3d'
            },
            settings: {
              solarsystem: false,
              stars: false,
              galaxy: false,

              logo: false,
              stats: false,
              tour: false,

              inclination: false,
              habitable_zone: true,
              unconfirmed: true,
              individial_orbit_colors: true
            }
          }
        });

        var menuView = new MenuView({ 
          app: app, 
          type: 'mainmenu',
          structure: {
            menu: [
              {
                "id": "systems",
                "title": "Show loaded systems"
              },
              {
                "id": "view-2d",
                "title": "2D View"
              },
              {
                "id": "view-3d",
                "title": "3D View"
              },
              {
                "id": "solarsystem",
                "title": "Compare with Solar System"
              },
              {
                "id": "settings",
                "title": "Open the Settings"
              }
            ]
          } 
        });

        var animationControlsView = new AnimationControlsView({ app: app });

        $('#interface').append(menuView.render().el);
        $('#interface').append(animationControlsView.render().el);

        window.app = app;
        
        app.addSystem(planetsystem.get('id'));
        app.afterRender();

      }

    });

  }

});
