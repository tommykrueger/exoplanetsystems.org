var View = require('./view');

var Shaders = require('lib/shaders');
var Particle = require('models/particle');

module.exports = View.extend({

  id: null,
  template: null,

  initialize: function( options ){
  	this.app = options.app;
    this.color = options.color || 0xffffff;
    this.transparency = options.transparency || 0.1;

    this.coordinateSystems = {
      'galaxy': {
        'group': new THREE.Object3D(),
        'visible': false,
        'rendered': false,
        'settings': {
          'rings': 10,  
          'segments': 36,
          'degrees': 360/10,
          'distance': (window.settings.LY * 10000 / window.settings.distancePixelRatio),
          'position': (-window.settings.LY * 28000 / window.settings.distancePixelRatio),
          'rotation': window.settings.galaxyPlaneRotation()
        }
      },
      'cluster': {
        'group': new THREE.Object3D(),
        'visible': false,
        'rendered': false,
        'settings': {
          'rings': 100,  
          'segments': 36,
          'distance': (window.settings.LY * 10 / window.settings.distancePixelRatio),
        }
      },
      'stars': {
        'group': new THREE.Object3D(),
        'visible': false,
        'rendered': false,
        'settings': {
          'rings': 100,  
          'segments': 36,
          'degrees': 360/10,
          'distance': (window.settings.LY * 1 / window.settings.distancePixelRatio),
        }
      },
      'planets': {
        'group': new THREE.Object3D(),
        'visible': false,
        'rendered': false,
        'settings': {
          'rings': 100,  
          'segments': 0,
          'degrees': 360/10,
          'distance': (window.settings.AU / window.settings.distancePixelRatio)
        }
      }
    }

  	this.update();

  	_.bindAll(
      this, 
      'renderDistanceLines', 
      'renderCoordinateSystem',
      'show',
      'hide',
      'update'
    );
  },

  renderDistanceLines: function() {
    var self = this;
    
    self.distanceLines = new THREE.Geometry();

     for ( var i = 0; i < self.app.stars.length; ++i ) {
      // var vector = new THREE.Vector3( self.app.stars[i].position.x, 0, self.app.stars[i].position.z );
      var vector = new THREE.Vector3( 0, 0, 0 );
      self.distanceLines.vertices.push( vector );
      self.distanceLines.vertices.push( self.app.stars[i].position );
    }

    var material = new THREE.LineBasicMaterial({
      color: self.color,
      opacity: self.transparency,
      transparent: true
    });

    var line = new THREE.Line( self.distanceLines, material, THREE.LinePieces );
    self.app.scene.add( line );
  },

  // Renders a coordinate system by type with Three.js Lines
  renderCoordinateSystem: function(type){
    var self = this;

    if (type == undefined){
      console.log('Warning: You need to specify the type of the coordinate system to render');
      return;
    }

    self.coordinateSystems[type].visible = true;

    if ( self.coordinateSystems[type].rendered === true )
      return;

    console.log('Rendering coordinate system for', type);
    self.coordinateSystems[type].visible = true;
    self.coordinateSystems[type].rendered = true;

    var settings = self.coordinateSystems[type].settings;
    var dist = settings.distance;

    var material = new THREE.LineBasicMaterial({ 
      blending: THREE.AdditiveBlending,
      color: self.color,
      opacity: self.transparency,
      linewidth: 2,
      transparent: true
    });

    var dashMaterial = new THREE.LineDashedMaterial({ 
      blending: THREE.AdditiveBlending,
      color: self.color,
      opacity: self.transparency/2,
      linewidth: 2,
      transparent: true,
      dashSize: dist/4, 
      gapSize: dist/4
    });

    // render the rings
    for (var i = 0; i < settings.rings + 1; i++) {

      var circle = new THREE.Shape();
          circle.moveTo(dist * i, 0 );
          circle.absarc( 0, 0, i * dist, 0, Math.PI*2, false );
      
      var points = circle.createPointsGeometry(settings.rings);

      circleLine = new THREE.Line(points, 
        new THREE.LineBasicMaterial({ 
          color: self.color,
          opacity: self.transparency,
          blending: THREE.AdditiveBlending,
          linewidth: 1,
          transparent: true
        })
      );
      
      // add one AU as offset to move it to the center    
      // v_circle.position.set(0, -100, 0);    
      if (settings.position !== undefined)
        circleLine.position.set(settings.position, 0, 0);
      else
        circleLine.position.set(0, 0, 0);

      if (settings.rotation !== undefined) 
        circleLine.rotation.set(settings.rotation, 0, 0);
      else
        circleLine.rotation.set(Math.PI/2, 0, 0);

      self.coordinateSystems[type].group.add( circleLine );
    }

     // render the angles
    for (var i = 0; i < settings.segments; i++) {
      var geometry = new THREE.Geometry();
          geometry.vertices.push( new THREE.Vector3(0, 0, 0) );
          geometry.vertices.push( new THREE.Vector3(settings.rings * settings.distance, 0, 0) );
          geometry.computeLineDistances();

      var shapeLine = null;
      if ( (i * 10) % 30 == 0 )
        shapeLine = new THREE.Line(geometry, material);
      else
        shapeLine = new THREE.Line(geometry, material);

      if (settings.position !== undefined)
        shapeLine.position.set(settings.position, 0, 0);
      else
        shapeLine.position.set(0, 0, 0);

      if (settings.rotation !== undefined) 
        shapeLine.rotation.set(settings.rotation, 0, 10*i * window.settings.toRad());
      else
        shapeLine.rotation.set(Math.PI/2, 0, 10*i * window.settings.toRad());

      this.coordinateSystems[type].group.add( shapeLine );
    }

    self.app.scene.add( this.coordinateSystems[type].group );
  },

  // shows a pre-rendered coordinate system depending on its context
  show: function( type ){
    var self = this;
    self.coordinateSystems[type].visible = true;
    _.each( self.coordinateSystems[type].group.children, function(line){
      line.visible = true;
    });
  },

  hide: function( type ){
    var self = this;
    self.coordinateSystems[type].visible = false;
    _.each( self.coordinateSystems[type].group.children, function(line){
      line.visible = false;
    });
  },

  // render loop to check the distance in light years and render the correct sized coordinate system
  update: function(){
    var self = this;

    var distance = self.app.currentDistanceLY;

    if (distance > 1000000) {
      self.hide('galaxy');
      self.hide('cluster');
      self.hide('stars');
      self.hide('planets');
    }

    if (distance > 1000 && distance <= 1000000) {
      if (!self.coordinateSystems.galaxy.rendered);
        self.renderCoordinateSystem('galaxy');

      self.show('galaxy');

      self.hide('stars');
      self.hide('planets');
    }

     if (distance > 100 && distance <= 10000) {

      if (!self.coordinateSystems.cluster.rendered);
        self.renderCoordinateSystem('cluster');

      self.show('cluster');

      self.hide('galaxy');
      self.hide('stars');
      self.hide('planets');
    }

    if (distance > 1 && distance < 100) {

      if (!self.coordinateSystems.stars.rendered);
        self.renderCoordinateSystem('stars');

      self.show('stars');

      self.hide('galaxy');
      self.hide('cluster');
      self.hide('planets');

    } else if (distance < 1) {

      if (!self.coordinateSystems.planets.rendered);
        self.renderCoordinateSystem('planets');

      self.show('planets');

      self.hide('galaxy');
      self.hide('cluster');
      self.hide('stars');
    }
  }

});