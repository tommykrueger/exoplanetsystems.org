var View = require('./view');

var Shaders = require('lib/shaders');
var Particle = require('models/particle');

module.exports = View.extend({

	id: null,
  template: null,

  initialize: function( options ){
  	this.app = options.app;
  	this.stars = options.stars;

    this.spectralStars = {
      'o': [],
      'b': [],
      'a': [],
      'f': [],
      'g': [],
      'k': [],
      'm': [],
      'l': [],
      't': [],
      'y': []
    };


    this.attributes = {
      size: { 
        type: 'f', 
        value: [] 
      },
      ca: { 
        type: 'c', 
        value: [] 
      }
    };

    this.uniforms = {
      amplitude: { 
        type: 'f', 
        value: 1.0 
      },
      color: { 
        type: 'c', 
        value: new THREE.Color( 0xffffff ) 
      },
      texture: { 
        type: 't', 
        value: this.app.textures.getStarMaterial() 
      }
    };

    this.interval = null;

    this.particleArray = [];
    this.particleCount = this.stars.length;
    this.particleSystems = new THREE.Object3D();

  	this.render();

  	_.bindAll(this, 'render', 'renderStarLabels', 'updateStarLabels', 'update');
  },

  render: function(){
  	var self = this;

    var values_size = self.attributes.size.value;
    var values_color = self.attributes.ca.value;

    for ( var i = 0; i < self.stars.length; i++ ) {
      values_size[i] = window.settings.LY * 0.1 / window.settings.distancePixelRatio;
      values_color[i] = new THREE.Color( 0xffffff );
    }

    self.particles = new THREE.Geometry();
    self.particleTexture = null;

    self.particleMaterial = new THREE.ShaderMaterial({
      uniforms: self.uniforms,
      attributes: self.attributes,
      vertexShader: self.app.shaders['starnames'].vertex,
      fragmentShader: self.app.shaders['starnames'].fragment,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });

    _.each( self.stars, function( star, idx ) {

      var ra = parseFloat(star.ra);
      var dec = parseFloat(star.dec);
      var distance = parseFloat(star.distance) * window.settings.LY / window.settings.distancePixelRatio;
      var distanceLY = parseFloat(star.distance) * window.settings.PC / window.settings.distancePixelRatio;
     
      // if distance is unknown we assume a distance of 500 parsec
      if( !distance || distance == 0 )
        distance = 500;

      // change distance to light years
      // var distance = star.dist * window.settings.PC * window.settings.LY / window.settings.distancePixelRatio;
      // var distanceLY = star.dist * window.settings.PC;

      // make every star the same distance from the center to make them visible
      var normalizedDistance = window.settings.AU / window.settings.distancePixelRatio;

      ra = ra * Math.PI / 180.0;
      dec = dec * Math.PI / 180.0;

      // star distance in parsec 
      // right acsession in h 
      // declination in h 
      var x = distance * Math.cos( (ra*15) ) * Math.cos( dec );
      var y = distance * Math.sin( (ra*15) ) * Math.cos( dec );
      var z = distance * Math.sin( dec );

      var particle = new Particle({ vector: new THREE.Vector3(x, y, z) });

      particle.properties = {
        id: star.id,
        name: star.proper_name,
        spectrum: star.spectrum,
        distance: star.distance,
        distanceLY: Math.round(star.distance * window.settings.PC)
      }
      // add it to the geometry
      self.particles.vertices.push( particle.position );
      self.particleArray.push( particle );
      // self.app.stars.push( particle );

      // display the star label name at the star's position
      // var pos = window.utils.project3DTo2D( particle.position, self.app );

      if (star.proper_name == '') {
        var $span = $('<span/>');
            $span.text(star.proper_name);
            $span.addClass('star-label');
            $span.addClass('star-label-' + idx);
            $span.attr('id', 'star-' + star.id);

            $span.css('top', pos.y);
            $span.css('left', pos.x);

            $('#star-labels').append($span);
      }
    });

    var particleSystem = new THREE.ParticleSystem(
      self.particles,
      self.particleMaterial
    );

    particleSystem.dynamic = true;

    // self.app.particleSystems = particleSystem;
    self.app.scene.add( particleSystem );
  },

  renderStarLabels: function(){

  },

  updateStarLabels: function(){
    var self = this;

    // divide the labeled stars into chunks to increase performance
    _.each(self.particleArray, function( star, idx ) {

      if (star) {
        var pos = window.utils.project3DTo2D( star.position, self.app );

        $('#star-' + star.properties.id).html( star.properties.name );
        $('#star-' + star.properties.id).css({
          'left': pos.x + window.settings.labelOffsetX + 'px',
          'top': pos.y + window.settings.labelOffsetY + 'px',
        });
      }
    }); 

  },

  update: function() {
    var self = this;

    /*
    for (var i = 0; i < self.attributes.size.value.length; i++) {

      if( self.particleArray[i].position ) {
        
        // this.setDistanceSize( this.particleArray[i] );
        var distance = window.utils.getDistance( self.app.camera.position, this.particleArray[i].position );
        
        // see http://stackoverflow.com/questions/13350875/three-js-width-of-view/13351534#13351534
        var vFOV = self.app.camera.fov * Math.PI / 180;
        var height = 2 * Math.tan( vFOV / 2 ) / (distance / window.settings.PC / window.settings.LY * window.settings.distancePixelRatio);

        var aspect = $(window).width() / $(window).height();
        var width = height * aspect; 

        var newWidth = 0;
        if( window.settings.stars.appearance == 'relative sizes' ) 
          newWidth = (2 / width * window.settings.LY / 200000 * this.particleArray[i].properties.radius );
        else  
          newWidth = (2 / width * window.settings.LY / 200000 );
        

        if( width && height ) {
          self.attributes.size.value[i] = newWidth;
        }
        
      }
    }

    self.attributes.size.needsUpdate = true;
    */
  }

});