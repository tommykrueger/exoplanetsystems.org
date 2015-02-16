var View = require('./view');

var Particle = require('models/particle');
var Shaders = require('lib/shaders');


/**
 * The Galaxy is rendered as a spiral galaxy.
 * 
 * There is a galaxy skeleton which defines the basic shape of the galaxy. 
 * 
 * A galaxy has a certain amount of star clusters, that has a high star density.
 * 
 * The Galaxy consists of dark nebulas which observe light.
 */

module.exports = View.extend({

	id: 'galaxy',
  template: false,

	initialize: function( options ) {
		console.log(' --- rendering galaxy --- ');

		this.app = options.app;
		this.particles = [];

		// the number of large stars
		this.starsCount = 1500;
		this.stars = null;
		this.starsRendered = false;

		// the number of star clusters
		this.starClustersCount = 25000;
		this.starClusters = null;
		this.starClustersRenderd = false;

		// the number of nebulars at the outer area of the galaxy
		this.nebulasCount = 5000;
		this.nebulas = null;
		this.nebulasRendered = false;

		this.bulge = null;
		this.bulgeRendered = false;

		this.anchor = new THREE.Object3D();
		this.group = new THREE.Geometry();

		this.anchor.add(this.group);

		this.plane = null;

		// rotation of the galactical plane around 63 degres from the solar system plane
		// see http://curious.astro.cornell.edu/question.php?number=633
		this.galacticalPlaneRotation = 63;

		// 2 times the sun
		this.minSize = 2;

		// 100000 light years
		this.width = 100000;

		// galaxy is 5000 light years high
		this.height = 5000;

		this.colors = [
			{ 'color': '#00ffff' },
			{ 'color': '#ff00ff' }
		];

		this.points = '565.62,482.2 593.58,450.95 623.18,408.19 626.47,362.15 591.94,324.32 536.02,294.72 476.82,291.43 412.68,302.94 346.9,357.21 315.65,421.35 299.21,469.04 300.85,534.82 320.59,580.87 345.26,630.21 356.77,663.1 389.66,710.79 429.13,730.53 486.69,758.48 524.51,779.86 583.71,781.51 637.98,769.99 674.17,751.9 728.44,725.59 495.59,470.09 464.09,521.09 431.09,561.59 434.09,593.09 462.59,626.08 506.09,639.58 566.09,653.08 624.58,639.58 672.58,606.58 707.08,579.59 750.58,543.59 803.08,456.59 801.58,351.6	749.08,240.6 674.29,170.05 674.29,170.05 606.69,125.03 503.09,93.5 409,93.5 305.1,128.11 239.1,164.11 140.11,261.6 729.58,521.09 752.08,459.59 738.58,387.6 714.58,317.1 696.58,288.6 645.58,245.1 569.09,204.61 507.59,201.61 432.59,207.61 348.6,246.6 282.6,285.6 225.6,363.6 200.1,443.09 173.11,542.09 195.61,629.08 227.1,699.58 254.1,294.6 198.61,357.6 168.61,387.6 149.11,432.59 126.61,500.09 119.11,563.09 147.61,678.58 204.6,761.08 228.6,801.58 302.1,870.57 362.06,639.79 426.58,680.18 543.58,720.63 603.58,717.6 687.58,692.09 750.58,645.59 795.57,590.09 857.04,497.09 870.5,443.09 870.5,388 870.57,314.1 840.57,236.1 542.09,629.08 597.58,609.58 644.08,555.59 674.08,479.09	666.58,422.09 566,348.5 470,348.5 393.6,402.6 374.1,483.59 386.1,552.59 497.05,480.55 474.57,509.07 453.58,537.58 434.09,563.08 432.59,600.58 464.09,632.04 507.59,645.5 572,645.5 633.58,630.58 704.08,585.59 746.08,543.59 803.08,456.59 809.07,441.59 797.08,345.6 743.08,246.6 725.08,225.6 663.58,161.11 641.08,143.11 620.08,126.61 585.59,116.11 549.59,102.61 476.09,92.11 407.09,93.61 333.6,108.61 252.6,156.61 171.61,224.1';

		// 100000 light years
		this.dimension = window.settings.LY * 10000 / window.settings.distancePixelRatio;

		// 28000 light years away from sun !
		this.distanceFromSunToCenter = window.settings.LY * 28000 / window.settings.distancePixelRatio;

		this.attributes = {
			size: {	type: 'f', value: [] },
			ca: {	type: 'c', value: [] }
		};

		this.clusterAttributes = {};

		//var texture = THREE.ImageUtils.loadTexture( 'img/Flare_KPL-a.png', null );

		this.uniforms = {
			amplitude: { type: "f", value: 1.0 },
			color: { type: "c", value: new THREE.Color( 0xffffff ) },
			texture: { type: "t", value: this.app.textures.getGalaxyStarMaterial() }
		};

		this.values_size = this.attributes.size.value;
		this.values_color = this.attributes.ca.value;

		// 10 light years from center
		this.minDistance = 10;
		this.points = this.points.split(' ');

		_.bindAll(this, 
			'getPlaneRotation',
			'render', 
			'renderSkeleton', 
			'renderStars', 
			'renderPlane', 
			'renderBulge', 
			'renderStarClusters', 
			'renderNebulas',
			'update'
		);

		this.render();
	},

	render: function(){
		// this.renderSkeleton();
		// this.renderStars();
		this.renderPlane();
		this.renderBulge();
		this.renderStarClusters();
		this.renderNebulas();
	},

	getPlaneRotation: function() {
		return -90 + window.settings.galaxy.planeRotation * window.settings.toRad();
	},

	renderSkeleton: function(){
		var self = this;

		for ( var i = 0; i < self.points.length; i++ ) {
			self.values_size[i] = window.settings.LY * 1000000 / window.settings.distancePixelRatio;
			self.values_color[i] = new THREE.Color( 0xffffff );
		}

		for ( var i = 0; i < self.points.length; i++ ) {

			var p = self.points[i].split(',');

			var x = parseFloat(p[0]) * window.settings.LY * 1000;
			var y = parseFloat(p[1]) * window.settings.LY * 1000;

					x = x / window.settings.distancePixelRatio;
					y = y / window.settings.distancePixelRatio;

			var particle = new Particle({ vector: new THREE.Vector3( x, y, 0 ) });
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

		var particleSystem = new THREE.ParticleSystem(
	    this.group,
	    this.material
	  );

	  particleSystem.rotation.set( this.getPlaneRotation(), 0, 0 );
	  particleSystem.position.set( -this.distanceFromSunToCenter, 0, 0 );
	  self.app.scene.add( particleSystem );
	},

	renderStars: function() {
		var self = this;

		if (self.starsRendered)
			return false;

		var values_size = this.attributes.size.value;
		var values_color = this.attributes.ca.value;

		for ( var i = 0; i < this.starsCount; i++ ) {

			values_size[i] = 500 * window.settings.LY / window.settings.distancePixelRatio;

			// set the size of the galaxy bulge
			if (i == 0) {

				mapC = THREE.ImageUtils.loadTexture( 'img/starcluster.png', null );

				var m = new THREE.SpriteMaterial({ 
					map: mapC, 
					color: 0xff00ff
				});

				var sprite = new THREE.Sprite( m );
						sprite.position.set( 0, 0, 0 );
						sprite.position.normalize();
						sprite.position.multiplyScalar( window.settings.LY * 100000 / window.settings.distancePixelRatio );

				var group = new THREE.Object3D();
						group.add( sprite );

				//self.app.scene.add( group );
				//self.app.scene.add( sprite );

				values_size[i] = 50000000 * window.settings.LY;		
				values_color[i] = new THREE.Color( 0xffffff );

				var particle = new Particle({ vector: new THREE.Vector3( 0, 0, 0 ) });

				this.particles.push( particle );
				this.group.vertices.push( particle.position );	

			} else {

				// set size variation
				// taken from: http://workshop.chromeexperiments.com/stars/js/galaxy.js
				if( Math.random() > 0.75 )
					values_size[i] *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * 0.75;	
				else if( Math.random() > 0.60 )
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
				var item = _.shuffle( self.points )[0];
				var item = item.split(',');

				var x = ( parseFloat(item[0]) - 500) * window.settings.LY * 200 / window.settings.distancePixelRatio;
				var y = ( parseFloat(item[1]) - 500) * window.settings.LY * 200 / window.settings.distancePixelRatio;

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

		self.stars = new THREE.ParticleSystem(
	    this.group,
	    this.material
	  );

	  self.stars.rotation.set( this.getPlaneRotation(), -180 * Math.PI / 180, 0 );
	  self.stars.position.set( -this.distanceFromSunToCenter, 0, 0 );

	  self.app.galaxyParticles = self.stars;
	  self.app.scene.add( self.stars );

	  self.starsRendered = true;

	  //self.app.galaxyParticles.traverse(function(child) { 
			//child.visible = true;
		//});

	},


	renderPlane: function() {
		var self = this;

		var material = new THREE.MeshBasicMaterial({
			map: self.app.textures.galaxyPlaneTexture(),
	  	transparent: true,
	  	opacity: 1.0,
	  	blending: THREE.AdditiveBlending,
	  	side: THREE.DoubleSide 
		});

		var radius = window.settings.LY * 100000 / window.settings.distancePixelRatio;
		var segments = 32;

		var circleGeometry = new THREE.CircleGeometry( radius, segments );				
		self.plane = new THREE.Mesh( circleGeometry, material );
		self.app.scene.add( self.plane );

		self.plane.rotation.set( this.getPlaneRotation(), 0, 0 );
	  self.plane.position.set( -self.distanceFromSunToCenter, 0, 0 );

	},

	renderBulge: function() {
		var self = this;

		if (self.bulgeRendered) 
			return;

		var material = new THREE.SpriteMaterial({ 
			//map: self.app.textures.getStarMaterial(),
			map: THREE.ImageUtils.loadTexture( "img/galaxy-bulge.png" ),
			color: 0xffffff,
			useScreenCoordinates: false,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending 
    });

		this.bulge = new THREE.Sprite( material );
		this.bulge.position = new THREE.Vector3(-this.distanceFromSunToCenter, 0, 0);
		this.bulge.scale.set( 
			60000000000000, 
			60000000000000, 
			1.0 
		);

		/*
		var geometry = new THREE.Geometry();
    // var texture = THREE.ImageUtils.loadTexture( 'img/starcluster.png', null );
    var texture = self.app.textures.starCluster();

    var uniforms = {
			amplitude: { type: "f", value: 1.0 },
			color: { type: "c", value: new THREE.Color( 0xffffff ) },
			texture: { type: "t", value: texture }
		}

		var attributes = {
			size: {	type: 'f', value: [] },
			ca: {	type: 'c', value: [] },
			alpha: { type: 'f', value: [] },
			rotation: { type: 'f', value: [] }
		}

		var values_size = attributes.size.value;
		var values_color = attributes.ca.value;
		var values_alpha = attributes.alpha.value;
		var values_rotation = attributes.rotation.value;

		var galaxyCenterCount = 100;
		for ( var i = 0; i < galaxyCenterCount; i++ ) {

			values_size[i] = (20000 * Math.random() + 1000) * window.settings.LY / window.settings.distancePixelRatio;		
			values_color[i] = new THREE.Color('#00ff00');

			var item = _.shuffle( self.points )[0];
			var item = item.split(',');

			var x = ( parseFloat(item[0]) - 500) * window.settings.LY * 250 / window.settings.distancePixelRatio;
			var y = ( parseFloat(item[1]) - 500) * window.settings.LY * 250 / window.settings.distancePixelRatio;
			var z = ( Math.random() * 50 - 50 ) * (window.settings.LY * 250);

			var particle = new Particle({ vector: new THREE.Vector3( x, y, z ) });
			geometry.vertices.push( particle.position );
		}

    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
			attributes: attributes,
      vertexShader: self.app.shaders['galaxydust'].vertex,
      fragmentShader: self.app.shaders['galaxydust'].fragment,
      blending: THREE.AdditiveBlending,
     	depthTest: false,
			depthWrite: false,	
      transparent: true
    });

    this.bulge = new THREE.ParticleSystem(
	    geometry,
	    material
	  );

	  this.bulge.rotation.set( this.getPlaneRotation(), 0, 0 );
	  this.bulge.position.set( -this.distanceFromSunToCenter, 0, 0 );
	  */

	  self.app.scene.add(this.bulge);
		
		// self.app.scene.add( this.bulge );
		self.bulgeRendered = true;

	},

	renderGalaxyCenter: function() {

	},

	renderGalaxyImage: function(){

	},

	renderStarClusters: function(){
		var self = this;

		if (self.starClustersRendered) 
			return;

		var geometry = new THREE.Geometry();
    // var texture = THREE.ImageUtils.loadTexture( 'img/starcluster.png', null );
    var texture = self.app.textures.starCluster();

    var uniforms = {
			amplitude: { type: "f", value: 1.0 },
			color: { type: "c", value: new THREE.Color( 0xffffff ) },
			texture: { type: "t", value: texture }
		}

		self.clusterAttributes = {
			size: {	type: 'f', value: [] },
			ca: {	type: 'c', value: [] },
			alpha: { type: 'f', value: [] },
			rotation: { type: 'f', value: [] }
		}

		var values_size = self.clusterAttributes.size.value;
		var values_color = self.clusterAttributes.ca.value;
		var values_alpha = self.clusterAttributes.alpha.value;
		var values_rotation = self.clusterAttributes.rotation.value;

		var colors = ['#FFFF00', '#c7bba1', '#b0a285', '#87775d', '#918263', '#E0FFFF', '#EEB4B4'];

    for ( var i = 0; i < self.starClustersCount; i++ ) {

			values_size[i] = (1000 * Math.random() + 750) * window.settings.LY / window.settings.distancePixelRatio;		

			var color = Math.round(window.utils.rand(0, 6));
			values_color[i] = new THREE.Color(colors[color]);
			//values_alpha[i] = Math.random() + 0.25;
			values_alpha[i] = 0.75;

			values_rotation[i] = Math.random() * 100;

			var item = _.shuffle( self.points )[0];
			var item = item.split(',');

			var x = ( parseFloat(item[0]) - 500) * window.settings.LY * 250 / window.settings.distancePixelRatio;
			var y = ( parseFloat(item[1]) - 500) * window.settings.LY * 250 / window.settings.distancePixelRatio;
			var z = ( Math.random() * 50 - 50 ) * (window.settings.LY * 250);

					x = x + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 12000 * window.settings.LY / window.settings.distancePixelRatio);	
					y = y + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 12000 * window.settings.LY / window.settings.distancePixelRatio);

			var z = 0 + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 8000 * window.settings.LY / window.settings.distancePixelRatio);	

			// create more density clusters around the center
			var rd = window.utils.rand(0, 10);

			if (rd >= 9.5) {

				//x = Math.round(window.utils.rand(-25000, 25000)) * window.settings.LY / window.settings.distancePixelRatio;
				//y = Math.round(window.utils.rand(-50000, 50000)) * window.settings.LY / window.settings.distancePixelRatio;
				//z = Math.round(window.utils.rand(-7500, 7500)) * window.settings.LY / window.settings.distancePixelRatio;

				if (rd > 9.6) {
					//values_size[i] = (2500 * Math.random() + 750) * window.settings.LY / window.settings.distancePixelRatio;	
				}

				if (rd > 9.9) {
					//values_size[i] = (7500 * Math.random() + 750) * window.settings.LY / window.settings.distancePixelRatio;	
				}
			}

			if( Math.random() > 0.95 )
				z *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * 0.8;	

			if( Math.random() > 0.5 )
				z *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * 0.15;	

			if (i == 0) {
				x = y = z = 0;
				x = this.distanceFromSunToCenter;
				values_size[i] = 7500000 * window.settings.LY / window.settings.distancePixelRatio;		
			} 

			var particle = new Particle({ vector: new THREE.Vector3( x, y, z ) });
			geometry.vertices.push( particle.position );
		}

    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
			attributes: self.clusterAttributes,
      vertexShader: self.app.shaders['galaxydust'].vertex,
      fragmentShader: self.app.shaders['galaxydust'].fragment,
      blending: THREE.AdditiveBlending,
      //blending: "CustomBlending",
			//blendSrc: "OneMinusDstAlphaFactor",
			//blendDst: "SrcColorFactor",
			//blendEquation: THREE.AddEquation,
     	depthTest: false,
			depthWrite: false,	
      transparent: true
    });

    this.starClusters = new THREE.ParticleSystem(
	    geometry,
	    material
	  );

	  this.starClusters.rotation.set( this.getPlaneRotation(), 0, 0 );
	  this.starClusters.position.set( -this.distanceFromSunToCenter, 0, 0 );

	  self.app.scene.add(this.starClusters);
	  self.starClustersRendered = true;

	},

	renderNebulas: function() {
		var self = this;

		if (self.nebulasRendered) 
			return;

		var geometry = new THREE.Geometry();
    var texture = THREE.ImageUtils.loadTexture( 'img/nebula-dust-02.png', null );

    var uniforms = {
			amplitude: { type: "f", value: 1.0 },
			color: { type: "c", value: new THREE.Color( 0xffffff ) },
			texture: { type: "t", value: texture }
		}

		var attributes = {
			size: {	type: 'f', value: [] },
			ca: {	type: 'c', value: [] },
			alpha: { type: 'f', value: [] },
			rotation: { type: 'f', value: [] }
		}

		// see: https://github.com/mrdoob/three.js/issues/1891#issuecomment-5923058
		var values_size = attributes.size.value;
		var values_color = attributes.ca.value;
		var values_alpha = attributes.alpha.value;
		var values_rotation = attributes.rotation.value;

    for ( var i = 0; i < self.nebulasCount; i++ ) {
			values_size[i] = Math.random() * 10000 * window.settings.LY / window.settings.distancePixelRatio;		

			var colors = ['#463521', '#DEB887', '#EEDFCC', '#E9967A'];
			var color = new THREE.Color( colors[Math.round(window.utils.rand(0,4))] );
			values_color[i] = color;

			/*
			// color variation orange/yellow (0.02 - 0.1)
			var random = (Math.random() > 0.90);
			values_color[i] = color.setHSL( 
				random ? window.utils.rand(0.5, 0.53) : window.utils.rand(0.02, 0.1), 
				window.utils.rand(0.55, 0.7), 
				0.5 
			);
			*/

			values_alpha[i] = Math.random() + 0.4;
			// values_rotation[i] = Math.random() * 100;

			var item = _.shuffle( self.points )[0];
			var item = item.split(',');

			var x = ( parseFloat(item[0]) - 500) * window.settings.LY * 200 / window.settings.distancePixelRatio;
			var y = ( parseFloat(item[1]) - 500) * window.settings.LY * 200 / window.settings.distancePixelRatio;
			var z = ( Math.random() * 50 - 50 ) * (window.settings.LY * 250);

					x = x + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 6000 * window.settings.LY / window.settings.distancePixelRatio);	
					y = y + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 6000 * window.settings.LY / window.settings.distancePixelRatio);

			var z = 0 + ( Math.round( Math.random() ) * 2 - 1 ) * (Math.random() * 2500 * window.settings.LY / window.settings.distancePixelRatio);	

			if( Math.random() > 0.98 )
				z *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * 0.8;	

			if( Math.random() > 0.5 )
				z *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * 0.15;	


			var particle = new Particle({ vector: new THREE.Vector3( x, y, z ) });
			geometry.vertices.push( particle.position );
		}

		// for blending see http://alteredqualia.com/three/examples/webgl_materials_blending_custom.html#
    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
			attributes: attributes,
      vertexShader: self.app.shaders['galaxydust'].vertex,
      fragmentShader: self.app.shaders['galaxydust'].fragment,
      //blending: THREE.SubtractiveBlending,
      depthTest: false,
      transparent: true,
      blending: "CustomBlending",
			blendSrc: "OneMinusDstAlphaFactor",
			blendDst: "SrcColorFactor",
			blendEquation: THREE.AddEquation
    });

    this.nebulas = new THREE.ParticleSystem(
	    geometry,
	    material
	  );

	  this.nebulas.rotation.set( this.getPlaneRotation(), 0, 0 );
	  this.nebulas.position.set( -this.distanceFromSunToCenter, 0, 0 );

	  self.app.scene.add(this.nebulas);
	  self.nebulasRendered = true;
	},

	getRandomPositionInRange: function() {

	},

	show: function(){

		var maxAmount = 7500;
		var maxPercent = 60;
		var currentAmount = this.app.currentDistanceLY;
		var percent = currentAmount * 100 / maxAmount;

		if (percent > maxPercent)
			percent = maxPercent;

		if (this.stars) {
			this.stars.traverse(function(child){
				child.visible = true;
			});
		}

		if (this.nebulas) {
			this.nebulas.traverse(function(child){
				child.visible = true;
				child.material.opacity = (percent / 100);
			});
		}

		if (this.starClusters) {
			this.starClusters.traverse(function(child){
				child.visible = true;
				child.opacity = (percent / 100);
			});
			this.starClusters.opacity = (percent / 100);
			this.starClusters.material.opacity = (percent / 100);
		}

		if (this.plane) {
			this.plane.visible = true;
			this.plane.material.opacity = (percent / 100);
		}

		if (this.bulge) {
			this.bulge.visible = true;
		}
	},

	hide: function() {
		//this.app.scene.remove(this.stars);
		//this.app.scene.remove(this.nebulas);

		if (this.stars) {
			this.stars.traverse(function(child){
				child.visible = false;
			});
		}

		if (this.nebulas) {
			this.nebulas.traverse(function(child){
				child.visible = false;
			});
		}

		if (this.starClusters) {
			this.starClusters.traverse(function(child){
				child.visible = false;
			});
		}

		if (this.plane) {
			this.plane.visible = false;
		}

		if (this.bulge) {
			this.bulge.visible = false;
		}
		
		this.starsRendered = false;
		this.nebulasRendered = false;
		this.starClustersRendered = false;
		this.bulgeRendered = false;
	},

	update: function( start, length ) {
		for ( var i = start; i < length; i++ ) {
			// this.attributes.size.value[i] = 10000;
		}
		// this.attributes.size.needsUpdate = true;
	}

});
