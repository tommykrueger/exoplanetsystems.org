var View = require('./view');

// var Shaders = require('lib/shaders');
var Particle = require('models/particle');

var LabelView = require('./label_view');

module.exports = View.extend({

	id: null,
  template: null,

  initialize: function( options ){
  	this.app = options.app;
  	this.stars = options.stars;

    /*
    this.stars.push({
      'id': 100000000,
      'pl_hostname': 'Sun',
      'ra': 0,
      'dec': 0,
      'dist': 0,
      'type': 'G5',
      'pl_num': 8,
      'habitable': 0,
      'mass': 1,
      'radius': 1,
      'constellation': ''
    });
    */  

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

    this.particleArray = [];
    this.particleCount = this.stars.length;

    this.habitableStars = [];

    this.sizeFlag = '';

    this.attributes = {
      size: { type: 'f', value: [] },
      ca: { type: 'c', value: [] },
      alpha: { type: 'f', value: [] }
    };

    this.uniforms = {
      amplitude: { type: 'f', value: 1.0 },
      color: { type: 'c', value: new THREE.Color( 0xffffff ) },
      texture: { type: 't', value: this.app.textures.getStarMaterial() }
    };

    this.attributes.alpha.needsUpdate = true;

    // every spectral class needs its own particle system that are saved 
    // to a group
    // multiple textures / colors in one particlesystem is not yet possible with three.js
    this.particleSystems = new THREE.Object3D();

  	this.render();

  	_.bindAll(this, 
      'render', 
      'renderHabitableStars', 
      'update', 
      'checkConditions'
    );
  },

  render: function(){
  	var self = this;

    // separate the stars by spectral type
    var values_size = self.attributes.size.value;
    var values_color = self.attributes.ca.value;
    var values_alpha = self.attributes.alpha.value;

    for ( var i = 0; i < self.stars.length; i++ ) {

      var spectralType = self.stars[i].type.substr(0, 1).toLowerCase().toString();

      if (self.spectralStars[spectralType])
        self.spectralStars[spectralType].push( self.stars[i] );

      values_size[i] = window.settings.LY * 100 / window.settings.distancePixelRatio;

      // console.log( window.settingsspectralColors[ spectralType ] );

      if (window.settings.spectralColors[ spectralType ] != undefined) {
        values_color[i] = new THREE.Color( window.settings.spectralColors[ spectralType ] );
      } else
        values_color[i] = new THREE.Color( 0xffffff );

      values_alpha[ i ] = 1.0;
    }

    self.attributes.alpha.needsUpdate = true;

    self.particles = new THREE.Geometry();
    self.particleTexture  = null;

    self.particleMaterial = new THREE.ShaderMaterial({
      uniforms: self.uniforms,
      attributes: self.attributes,
      vertexShader: self.app.shaders['stars'].vertex,
      fragmentShader: self.app.shaders['stars'].fragment,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });

    _.each( self.stars, function( star, idx ) {

      var $span = $('<span>' + star.pl_hostname + '</span>');
          $span.addClass('star-label');
          $span.addClass('star-label-' + idx);

      /*
      $this.material = new THREE.ParticleBasicMaterial({
        map: _Textures.getStarMaterial(),
        color: window.settingsspectralColors[ star.type.substr(0, 1).toLowerCase() ],
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        size: window.settings.stars.size
      });
      */

      // if distance is unknown we assume a distance of 500 parsec
      if( !star.dist || star.dist == 0 )
        star.dist = 500;

      if (star.pl_hostname == 'Sun')
        star.dist = 0;

      // change distance to light years
      var distance = star.dist * window.settings.PC * window.settings.LY / window.settings.distancePixelRatio;
      var distanceLY = star.dist * window.settings.PC;

      // make every star the same distance from the center to make them visible
      var normalizedDistance = window.settings.AU / window.settings.distancePixelRatio;

      // for each particle set the space position depending on its distance, right acsession and declination
      // taken from http://www.stjarnhimlen.se/comp/tutorial.html
      // var x = normalizedDistance * Math.cos( star.ra ) * Math.cos( star.dec );
      // var y = normalizedDistance * Math.sin( star.ra ) * Math.cos( star.dec );
      // var z = normalizedDistance * Math.sin( star.dec );

      star.ra = star.ra * Math.PI / 180.0;
      star.dec = star.dec * Math.PI / 180.0;

      // star distance in parsec 
      // right acsession in h 
      // declination in h 
      var x = distance * Math.cos( (star.ra*15) ) * Math.cos( star.dec );
      var y = distance * Math.sin( (star.ra*15) ) * Math.cos( star.dec );
      var z = distance * Math.sin( star.dec );

      // check star conditions
      if ( self.checkConditions(star) ) {

        var particle = new Particle({ vector: new THREE.Vector3(x, y, z) });

        particle.properties = {
          id: star.id,
          name: star.pl_hostname,
          type: star.type,
          distance: star.dist,
          distanceLY: Math.round(star.dist * window.settings.PC),
          mass: star.mass,
          radius: star.radius,
          planets: star.pl_num,
          habitable: star.habitable,
          constellation: star.constellation,
          position: {
            x:x, 
            y:y, 
            z:z 
          }
        }

        // add it to the geometry
        self.particles.vertices.push( particle.position );
        self.particleArray.push( particle );
        self.app.stars.push( particle );

        if ( parseInt(star.habitable) == 1)
          self.habitableStars.push(particle.properties);

      } else {
        console.log( 'star not in range' );
      }

    });

    var particleSystem = new THREE.ParticleSystem(
      self.particles,
      self.particleMaterial
    );

    particleSystem.dynamic = true;

    // rotate the whole particle system by 39 degrees
    // see http://www.astronews.com/forum/archive/index.php/t-3533.html
    // particleSystem.rotation.x = -39 * (Math.PI/180);
      

    self.app.particleSystems = particleSystem;
    self.app.scene.add( particleSystem );

    self.renderHabitableStars();

    console.log(self.habitableStars);

  },

  renderHabitableStars: function(){
    var self = this;
    
    var particles = new THREE.Geometry();
    var material = new THREE.ParticleBasicMaterial({
      map: self.app.textures.getHabitableStarMaterial(),
      color: '#00ff00',
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      size: window.settings.LY * 2 / window.settings.distancePixelRatio
    });

    _.each( self.habitableStars, function(star, index){
      
      var particle = new Particle({ 
        vector: new THREE.Vector3(
          star.position.x, 
          star.position.y, 
          star.position.z
        ) 
      });

      var vector = new THREE.Vector3(
        star.position.x, 
        star.position.y, 
        star.position.z
      );

      var pos = window.utils.project3DTo2D( vector, self.app );

      var $label = $('<span/>');
          $label.attr('id', 'habitable-label-' + star.id);
          $label.attr('class', 'space-label habitable-star-label');
          $label.html('<span class="text">' + star.name + '</span>');

          $label.css({'left': pos.x, 'top': pos.y});

      $('#labels').append($label);

      particles.vertices.push( particle.position );

    });

    //var particleSystem = new THREE.ParticleSystem(
      //particles, material
    //);

    //self.app.scene.add(particleSystem);
  },

  update: function() {
    var self = this;

    if (self.habitableStars.length) {
      for (var i = 0; i < self.habitableStars.length; i++) {

        var vector = new THREE.Vector3(
          self.habitableStars[i].position.x,
          self.habitableStars[i].position.y,
          self.habitableStars[i].position.z
        );
        var pos = window.utils.project3DTo2D( vector, self.app );
        $('#habitable-label-' + self.habitableStars[i].id).css({'left': pos.x, 'top': pos.y});
      }
    }

    for (var i = 0; i < self.attributes.size.value.length; i++) {
      if ( self.particleArray[i].position ) {
        
        // this.setDistanceSize( this.particleArray[i] );
        var distance = window.utils.getDistance( self.app.camera.position, this.particleArray[i].position );
        
        // see http://stackoverflow.com/questions/13350875/three-js-width-of-view/13351534#13351534
        var vFOV = self.app.camera.fov * Math.PI / 180;
        var height = 2 * Math.tan( vFOV / 2 ) / (distance / window.settings.PC / window.settings.LY * window.settings.distancePixelRatio);

        var aspect = $(window).width() / $(window).height();
        var width = height * aspect; 

        var newWidth = 0;
        if( window.settings.stars.appearance == 'relative sizes' ) 
          newWidth = (window.settings.stars.minSize / width * window.settings.LY / 100000 * this.particleArray[i].properties.radius );
        else  
          newWidth = (window.settings.stars.minSize / width * window.settings.LY / 100000 );
        

        if( width && height ) {
          self.attributes.size.value[i] = newWidth;
        }
        
      }
    }
    
    // self.attributes.size.needsUpdate = true;
  },

  checkConditions: function( star ) {

    var distanceLY = star.dist * window.settingsPC;
    //console.log( distanceLY, star.pl_num );
    if ( star.pl_num >= window.settings.stars.minPlanets )
      return true;
  }

});