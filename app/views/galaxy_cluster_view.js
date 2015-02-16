var View = require('./view');

var Particle = require('models/particle');
var Shaders = require('lib/shaders');


/**
 * Galaxy Clusters are rendered
 * There are basically two types of galaxies (spiral, spherical galaxies)
 */

module.exports = View.extend({

	id: 'galaxy-clusters',
  template: false,

	initialize: function( options ) {
		console.log(' --- rendering galaxy cluster --- ');

		this.app = options.app;
		this.particles = [];

		// the number of small stars
		this.galaxyCount = 750;
		this.galaxies = null;
		this.galaxiesRendered = false;

		// the number of star clusters
		this.clustersCount = 500;
		this.clusters = null;
		this.clustersRendered = false;

		this.group = new THREE.Geometry();

		this.texture = THREE.ImageUtils.loadTexture( 'img/galaxy.jpg', null );

		this.points = '565.62,482.2 593.58,450.95 623.18,408.19 626.47,362.15 591.94,324.32 536.02,294.72 476.82,291.43 412.68,302.94 346.9,357.21 315.65,421.35 299.21,469.04 300.85,534.82 320.59,580.87 345.26,630.21 356.77,663.1 389.66,710.79 429.13,730.53 486.69,758.48 524.51,779.86 583.71,781.51 637.98,769.99 674.17,751.9 728.44,725.59 495.59,470.09 464.09,521.09 431.09,561.59 434.09,593.09 462.59,626.08 506.09,639.58 566.09,653.08 624.58,639.58 672.58,606.58 707.08,579.59 750.58,543.59 803.08,456.59 801.58,351.6	749.08,240.6 674.29,170.05 674.29,170.05 606.69,125.03 503.09,93.5 409,93.5 305.1,128.11 239.1,164.11 140.11,261.6 729.58,521.09 752.08,459.59 738.58,387.6 714.58,317.1 696.58,288.6 645.58,245.1 569.09,204.61 507.59,201.61 432.59,207.61 348.6,246.6 282.6,285.6 225.6,363.6 200.1,443.09 173.11,542.09 195.61,629.08 227.1,699.58 254.1,294.6 198.61,357.6 168.61,387.6 149.11,432.59 126.61,500.09 119.11,563.09 147.61,678.58 204.6,761.08 228.6,801.58 302.1,870.57 362.06,639.79 426.58,680.18 543.58,720.63 603.58,717.6 687.58,692.09 750.58,645.59 795.57,590.09 857.04,497.09 870.5,443.09 870.5,388 870.57,314.1 840.57,236.1 542.09,629.08 597.58,609.58 644.08,555.59 674.08,479.09	666.58,422.09 566,348.5 470,348.5 393.6,402.6 374.1,483.59 386.1,552.59 497.05,480.55 474.57,509.07 453.58,537.58 434.09,563.08 432.59,600.58 464.09,632.04 507.59,645.5 572,645.5 633.58,630.58 704.08,585.59 746.08,543.59 803.08,456.59 809.07,441.59 797.08,345.6 743.08,246.6 725.08,225.6 663.58,161.11 641.08,143.11 620.08,126.61 585.59,116.11 549.59,102.61 476.09,92.11 407.09,93.61 333.6,108.61 252.6,156.61 171.61,224.1';
		this.points = this.points.split(' ');

		this.distanceFromSunToCenter = window.settings.LY * 28000 / window.settings.distancePixelRatio;

		this.attributes = {
			size: {	type: 'f', value: [] },
			ca: {	type: 'c', value: [] }
		};

		this.uniforms = {
			amplitude: { type: "f", value: 1.0 },
			color: { type: "c", value: new THREE.Color( 0xffffff ) },
			texture: { type: "t", value: this.texture }
		};

		_.bindAll(this, 
			'render', 
			'renderClusters',
			'update'
		);

		this.render();
	},

	render: function(){
		this.renderClusters();
	},

	renderClusters: function() {
		var self = this;

		if(self.galaxiesRendered)
			return false;

		var values_size = this.attributes.size.value;
		var values_color = this.attributes.ca.value;

		for ( var i = 0; i < this.galaxyCount; i++ ) {

			//values_size[i] = Math.random() * 1000;
			values_size[i] = 1000000 * window.settings.LY / window.settings.distancePixelRatio;

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


			// pick a random point of the galaxy points
			//var item = _.shuffle( self.points )[0];
			//var item = item.split(',');

			var x = window.settings.LY * (Math.random()*2000000000) / window.settings.distancePixelRatio;
			var y = window.settings.LY * (Math.random()*2000000000) / window.settings.distancePixelRatio;

					x = x + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 120000000 * window.settings.LY / window.settings.distancePixelRatio);	
					y = y + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 120000000 * window.settings.LY / window.settings.distancePixelRatio);

			var z = 0 + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 35000000 * window.settings.LY / window.settings.distancePixelRatio);	

			if( Math.random() > 0.75 )
				z *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * 0.5;	

			if( Math.random() > 0.25 )
				z *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * 1;	

	    var particle = new Particle({ vector: new THREE.Vector3(x, y, z) });

	    this.particles.push( particle );
			this.group.vertices.push( particle.position );
		}

		this.material = new THREE.ShaderMaterial({
			uniforms: self.uniforms,
			attributes: self.attributes,
			vertexShader: self.app.shaders['galaxy'].vertex,
			fragmentShader: self.app.shaders['galaxy'].fragment,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		});

		self.galaxies = new THREE.ParticleSystem(
	    this.group,
	    this.material
	  );

	  self.galaxies.rotation.set( -90 * Math.PI / 180, -180 * Math.PI / 180, 0 );
	  self.galaxies.position.set( -this.distanceFromSunToCenter, 0, 0 );

	  // self.app.galaxyParticles = self.galaxies;
	  self.app.scene.add( self.galaxies );

	  self.galaxiesRendered = true;

	},

	show: function(){
		if (!this.galaxiesRendered) {
			console.log('showing galaxy cluster');
			this.galaxies.traverse(function(child){
				child.visible = true;
			});
		}
		this.galaxiesRendered = true;
	},

	hide: function() {
		if (this.galaxiesRendered) {
			console.log('hiding galaxy cluster');
			this.galaxies.traverse(function(child){
				// child.visible = false;
			});
		}
		
		//this.galaxiesRendered = false;
	},

	update: function( start, length ) {
		for ( var i = start; i < length; i++ ) {
			//this.attributes.size.value[i] = 10000;
		}
		//this.attributes.size.needsUpdate = true;
	}

});
