var View = require('./view');

var Particle = require('models/particle');
var Shaders = require('lib/shaders');


/**
 * Firmament
 */

module.exports = View.extend({

	id: 'galaxy clusters',
  template: false,

	initialize: function( options ) {
		console.log(' --- rendering firmaments --- ');

		this.app = options.app;
		this.particles = [];

		// the number of small stars
		this.firmamentCount = 750;
		this.firmaments = null;
		this.firmamentRendered = false;

		this.group = new THREE.Geometry();

		this.texture = THREE.ImageUtils.loadTexture( 'img/galaxy.jpg', null );

		this.attributes = {
			size: {	type: 'f', value: [] },
			ca: {	type: 'c', value: [] }
		};

		this.uniforms = {
			amplitude: { type: "f", value: 1.0 },
			color: { type: "c", value: new THREE.Color( 0xffffff ) },
		};

		_.bindAll(this, 
			'render', 
			'update'
		);

		this.render();
	},

	render: function() {
		var self = this;

		if(self.firmamentRendered)
			return false;

		var values_size = this.attributes.size.value;
		var values_color = this.attributes.ca.value;

		for ( var i = 0; i < this.firmamentCount; i++ ) {

			//values_size[i] = Math.random() * 1000;
			values_size[i] = 100000*100000 * window.settings.LY / window.settings.distancePixelRatio;

			// set size variation
			// taken from: http://workshop.chromeexperiments.com/stars/js/galaxy.js
			if( Math.random() > 0.95 )
				values_size[i] *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * 0.75;	
			else if( Math.random() > 0.90 )
				values_size[i] *= 1 + Math.pow(1 + Math.random(), 2) * 0.25;


			// define the star colors
			if( Math.random() > 0.99 )
				values_color[i] = new THREE.Color( window.settings.galaxyStarColors[0].color );
			else if( Math.random() > 0.40 )
				values_color[i] = new THREE.Color( window.settings.galaxyStarColors[1].color );
			else if( Math.random() > 0.05 )
				values_color[i] = new THREE.Color( window.settings.galaxyStarColors[2].color );
			else 
				values_color[i] = new THREE.Color( window.settings.galaxyStarColors[3].color );


			var x = window.settings.LY * (Math.random() * 2000000) / window.settings.distancePixelRatio;
			var y = window.settings.LY * (Math.random() * 2000000) / window.settings.distancePixelRatio;

					x = x + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 12000 * window.settings.LY / window.settings.distancePixelRatio);	
					y = y + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 12000 * window.settings.LY / window.settings.distancePixelRatio);

			var z = 0 + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 3500 * window.settings.LY / window.settings.distancePixelRatio);	

			if( Math.random() > 0.98 )
				z *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * 0.8;	

			if( Math.random() > 0.5 )
				z *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * 0.15;	

	    var particle = new Particle({ vector: new THREE.Vector3(x, y, z) });

	    this.particles.push( particle );
			this.group.vertices.push( particle.position );
		}

		this.material = new THREE.ShaderMaterial({
			uniforms: self.uniforms,
			attributes: self.attributes,
			vertexShader: self.app.shaders['firmament'].vertex,
			fragmentShader: self.app.shaders['firmament'].fragment,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		});

		self.firmaments = new THREE.ParticleSystem(
	    this.group,
	    this.material
	  );

	  self.firmaments.rotation.set( -90 * Math.PI / 180, -180 * Math.PI / 180, 0 );
	  self.firmaments.position.set( -this.distanceFromSunToCenter, 0, 0 );

	  self.app.firmamentParticles = self.firmaments;
	  self.app.scene.add( self.firmaments );

	  self.firmamentRendered = true;

	},

	show: function(){
		if (!this.firmamentRendered) {
			this.firmaments.traverse(function(child){
				child.visible = true;
			});
		}
		this.firmamentRendered = true;
	},

	hide: function() {
		if (this.firmamentRendered) {
			this.firmaments.traverse(function(child){
				child.visible = false;
			});
		}
		
		this.firmamentRendered = false;
	},

	update: function( start, length ) {
		for ( var i = start; i < length; i++ ) {
			//this.attributes.size.value[i] = 10000;
		}
		//this.attributes.size.needsUpdate = true;
	}

});
