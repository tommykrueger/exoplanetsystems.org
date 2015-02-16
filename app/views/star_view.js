var View = require('./view');

var Textures = require('lib/textures');
var Geometries = require('lib/geometries');

module.exports = View.extend({

	id: null,
  template: null,
  
  initialize: function( options ){
  	console.log( options );

  	this.app = options.app;
  	this.data = options.data;
  	this.objectPlane = new THREE.Object3D();
  	options.data.parentGroup.add( this.objectPlane );

  	this.animationFunctions = [];

  	this.render();
		// this.renderOrbit();
		this.prepareAnimations();

		_.bindAll(this, 'render', 'prepareAnimations');

  	return this.object;
  },

  render: function() {
  	var self = this;

  	
		// Stars are rendered as glowing light source
		// render as lens flare
		this.textureLensFlare = THREE.ImageUtils.loadTexture( "img/lensflare0.png" );

	  var light = new THREE.PointLight( 0xffffff, 1.5, 4500 );
				light.color.setHSL( 0.25, 0.9, 0.5 );
				light.position.set( 0, 0, 0 );
				
		// App.bulgeLight = light;
		light.intensity = 0.01;
		this.app.scene.add( light );

		var flareColor = new THREE.Color( 0xffffff );
				//flareColor.setHSL( 0.55, 0.9, 0.5 + 0.7 );
				flareColor.setHSL( 0.25, 0.4, 0.5 + 0.7 );

		var lensFlare = new THREE.LensFlare( this.textureLensFlare, 128, 0.0, THREE.AdditiveBlending, flareColor );

		lensFlare.add( this.textureLensFlare, 32, 0.0, THREE.AdditiveBlending );
		lensFlare.add( this.textureLensFlare, 32, 1.0, THREE.AdditiveBlending );

		// lensFlare.add( this.textureLensFlare, 60, 0.6, THREE.AdditiveBlending );
		// lensFlare.add( this.textureLensFlare, 70, 0.7, THREE.AdditiveBlending );
		// lensFlare.add( this.textureLensFlare, 120, 0.9, THREE.AdditiveBlending );
		// lensFlare.add( this.textureLensFlare, 70, 1.0, THREE.AdditiveBlending );

		lensFlare.customUpdateCallback = function(){ return false; };
		lensFlare.position = light.position;

		// App.bulge = lensFlare;
		// this.app.scene.add( lensFlare );

		this.rotationPeriod = window.settings.defaultStarRotationPeriod;

		var radius = window.settings.radiusSun * self.data.radius / window.settings.radiusStarPixelRatio;

		// render star as geometry
		geometry = new THREE.SphereGeometry( radius, 32, 32 );
		var material = new THREE.MeshBasicMaterial({
		  map: THREE.ImageUtils.loadTexture("img/materials/sun.jpg"),
		  shading: THREE.SmoothShading, 
		  blending: THREE.AdditiveBlending, 
		  color: 0xffffff, 
		  ambient: 0xffffff, 
		  shininess: 100
		});

		this.object = new THREE.Mesh( geometry, material );
		this.objectPlane.add( this.object );
		this.app.meshes.push(this.object);

		this.object.name = self.data.name;
		this.object.properties = {
			type: 'star',
			radius: self.data.radius,
			mass: self.data.mass,
			temp: self.data.temp,
			distance:  ( self.data.dist * window.settings.PC ).toFixed(2),
			minhz: self.data.minhz / 1000,
			maxhz: self.data.maxhz / 1000,
			planets: self.data.planets,
			habitable: self.data.habitable,
			texture: 'sun.jpg',
			spectralClass: self.data.spec.toLowerCase()
		}

		//this.app.meshes.push( this.object );
		//this.app.scene.add( this.object );

		
		var material = new THREE.SpriteMaterial({ 
			//map: self.app.textures.getStarMaterial(),
			map: THREE.ImageUtils.loadTexture( "img/lensflare0.png" ),
			color: 0xab9000,
			useScreenCoordinates: false,
      sizeAttenuation: true,
      transparent: true,
      blending: THREE.AdditiveBlending 
    });

		var sprite = new THREE.Sprite( material );
		sprite.position = new THREE.Vector3(0,0,0);
		sprite.scale.set( 
			self.data.radius * 1024 * 4, 
			self.data.radius * 1024 * 4, 
			1.0 
		);
		
		self.app.scene.add( sprite );
  },

  prepareAnimations: function(){
  	var self = this;
  	self.animationFunctions.push(function() {

    	if (self.rotationPeriod) {
    		if ( self.rotationClockwise === false )
					self.object.rotation.y -= self.app.currentSpeed / (24 * 60 * 60);    	
				else
					self.object.rotation.y += self.app.currentSpeed / (24 * 60 * 60);    	
    	}
    });

    self.objectPlane.animate = function() {	
			self.animationFunctions.forEach(function(dt) {
				dt();
			});
    };
  }

});