
var Textures = require('lib/textures');
var Geometries = require('lib/geometries');

// models
var Solarsystem = require('models/solarsystem');

// views
var FirmamentView = require('views/firmament_view');
var GalaxyClusterView = require('views/galaxy_cluster_view');
var GalaxyView = require('views/galaxy_view');
var PlanetSystemView = require('views/planetsystem_view');
var ParticleStarsView = require('views/particle_stars_view');
var StarsView = require('views/stars_view');
var TourView = require('views/tour_view');

var CoordinateSystemView = require('views/coordinate_system_view');
var GalaxySkyboxView = require('views/galaxy_skybox_view');

// helpers 
var CameraHelper = require('lib/helper/CameraHelper');
var CanvasElement = require('lib/helper/CanvasElement');

// Base class for all models.
module.exports = Backbone.Model.extend({

  initialize: function(options) {
  	var self = this;

  	this.stars = options.stars;
  	this.planetsystems = options.planetsystems;
  	this.constellations = options.constellations;
  	this.shaders = options.shaders;

  	this.config = {
  		loadAdditionalSystem: true,
  		distance: {
  			type: 'LY',
  			value: 1000
  		},
  		camera: {
  			view: '3d'
  		},
  		settings: {
  			solarsystem: true,
        stars: true,
        galaxy: true,

        logo: true,
        stats: true,
        tour: true,

        inclination: true,
        habitable_zone: false,
        unconfirmed: true,
        individial_orbit_colors: false
  		}
  	};

  	this.config = $.extend({}, this.config, options.config);

   	this.scene;
		this.renderer;
		this.camera; 
		this.cameraControls;
		this.controls;
		this.projector;
		this.trackingOrbit = null;
		this.cameraTarget = new THREE.Vector3(0,0,0);

		this.meshes = [];
		this.materials = [];
		this.systems = [];
		this.orbits = [];
		this.labels = [];
		this.stars = [];
		this.loadedStars = [];
		this.particleSystems = [];
		this.particleStars = null;
		this.starLines = [];
		this.markers = [];
		this.currentStar = {};

		this.galaxy = null;
		this.tour = null;
		this.bulge = null;
		this.bulgeLight = null;
		this.galaxyParticles = [];

		this.known_stars = null;
		this.habitableStarLabels = [];

		this.uniforms;
		this.attributes;

		// holds current camera position
		// can be used to determine camera position changes
		this.cameraPosition = 0;
		this.cameraPositionOld = 0;

		this.cameraHelper = null;
		this.galaxySkybox = null;

		this.habitableZones = [];
		this.gridPlane;

		this.starLinesRendered = false;

		this.distanceObjects = {
			'au': [],
			'lightyears': []
		};

		// amount of loops to quit certain code part
		this.allowedRenderLoops = 10;
		this.currentRenderLoops = 0;

		// used for changing simulation speed
		this.time = Date.now();
		this.simTime = this.time;
		this.simTimeSecs = null;

		this.defaultSpeed = 100;

		this.startTime = _.now();

		// current speed (1 earth day represents 365/100 seconds in app)	
		this.currentSpeed = 100;
		this.speedStep = 100;

		this.date = new Date( this.simTime );
		this.timeElapsedSinceCameraMove = 0;
		this.timeElapsed = 0;

		this.interestingSystems = [
			'gj 667c.json',
			'kepler-62.json',
			'kepler-90.json'
		];

		// the current distance from the center in light years (from vector(0,0,0))
		this.currentDistanceLY = 0;

		if( Detector.webgl ){

			this.renderer = new THREE.WebGLRenderer({
				antialias: true,
				alpha: true,

				// to allow screenshot
				preserveDrawingBuffer: true	
			});

			this.renderer.setClearColor( 0x000000, 1 );
		} else {

			var message = new Message('no-webgl', 'warning');
					message.render();

			return;

			//console.log( Detector.addGetWebGLMessage() );
			//this.renderer = new THREE.CanvasRenderer();

			//alert( Detector.addGetWebGLMessage() );
			//return;
		}

		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowMapEnabled = true;

		this.container = document.getElementById('container');
		this.container.appendChild(this.renderer.domElement);

		// window.utils.renderStats();

		// create a scene
		this.scene = new THREE.Scene();
		this.textures = new Textures();
		this.initCamera();
		this.initLighting();

		// allow 'p' to make screenshot
		// THREEx.Screenshot.bindKey(this.renderer);
			
		// allow 'f' to go fullscreen where this feature is supported
		//if( THREEx.FullScreen.available() ){
			//THREEx.FullScreen.bindKey();
		//}

	  this.projector = new THREE.Projector();

	  // add event listeners
	  //document.addEventListener( 'mousedown', this.onDocumentMouseDown.bind(this), false );
	  document.addEventListener( 'mousemove', this.onDocumentMouseMove.bind(this), false );
	  document.addEventListener( 'mouseover', this.onDocumentMouseMove.bind(this), false );

	  this.addSolarSystem();

	  _.defer(function(){

	  	if (self.config.settings.galaxy)
	  		self.galaxy = new GalaxyView({ app: self });

	  	if (self.config.settings.tour)
	  		self.tour = new TourView({ app: self });

	  	self.coordinateSystem = new CoordinateSystemView({ app: self });
	  	self.cameraHelper = new CameraHelper({ app: self });
	  });

	  setTimeout(function(){

	  	// render all stars that have at least one planet nad make them markable
	  	if (self.config.settings.stars)
	  		self.renderStars();

	  	// self.renderKnownStars();
	  	// self.galaxyCluster = new GalaxyClusterView({ app: self });
	  	// self.firmament = new FirmamentView({ app: self });
	  	// self.galaxySkybox = new GalaxySkyboxView({ app: self });

	  }, 100);

	  /*
	  setTimeout(function(){
	  	// render Orion stars
	  	var orionStars = [
	  		{	
	  			"name": "Beteigeuze",
	  			"ra": 9.04,
	  			"dec": 5.72,
	  			"dist": 200
	  		},
	  		{	
	  			"name": "Rigel",
	  			"ra": 3.51,
	  			"dec": 2.64,
	  			"dist": 773
	  		},
	  		{	
	  			"name": "Saiph",
	  			"ra": 1.50,
	  			"dec": 1.14,
	  			"dist": 721
	  		},
	  		{	
	  			"name": "Bellatrix",
	  			"ra": 4.41,
	  			"dec": 3.07,
	  			"dist": 243
	  		},
	  		{	
	  			"name": "Mintaka",
	  			"ra": 4.92,
	  			"dec": 2.38,
	  			"dist": 916
	  		},
	  		{	
	  			"name": "Alnitak",
	  			"ra": 5.19,
	  			"dec": 2.29,
	  			"dist": 817
	  		},
	  		{	
	  			"name": "Alnilam",
	  			"ra": 3.69,
	  			"dec": 1.67,
	  			"dist": 1342
	  		}
	  	];


	  	_.each(orionStars, function(star){
	  		console.log(star);

	  		var distance = star.dist * window.settings.PC * window.settings.LY / window.settings.distancePixelRatio;

	  		//star.ra = star.ra * Math.PI / 180.0;
	      //star.dec = star.dec * Math.PI / 180.0;

	      var x = distance * Math.cos( (star.ra*15) ) * Math.cos( star.dec );
	      var y = distance * Math.sin( (star.ra*15) ) * Math.cos( star.dec );
	      var z = distance * Math.sin( star.dec );

	      var geometry = new THREE.SphereGeometry( 1000000, 32, 32 );
				var material = new THREE.MeshLambertMaterial({ 
					color: 0xffffff
				});

				console.log(x,y,z);

	      var starObj = new THREE.Mesh(geometry, material);
	      		starObj.position.set(
	      			x / window.settings.distancePixelRatio, 
	      			y / window.settings.distancePixelRatio, 
	      			z / window.settings.distancePixelRatio
	      		);

	      self.scene.add(starObj);

	  	});

	  }, 1000);
		*/

	  // render on the basis of 10 (10AU, 100AU, 1000AU, etc.)
	  // this.renderDistanceCircles(5, 'au');
		// this.renderDistanceCircles(5, 'lightyears');

		this.cameraPosition = new THREE.Vector3();
		this.cameraPosition = this.cameraPosition.getPositionFromMatrix( this.camera.matrixWorld );
		this.cameraPositionOld = this.cameraPosition;

		this.canvasElement = new CanvasElement({ 
			app: self, 
			type: 'star' 
		});

		if (this.config.settings.stats)
			window.utils.renderStats();

		this.animate();

		_.bindAll(this, 'moveCamera', 'initCamera', 'initLighting', 'loadSystem');

		return this;
  },

  initCamera: function(target){
  	var self = this;

  	if (target)
  		self.cameraTarget = target;

  	// put a camera in the scene
		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, window.settings.LY );
		this.camera.useQuaternion = true;

		if (self.config.camera.view == '3d') {
			this.camera.position.set(
				window.utils.makeDistance( self.config.distance.value, self.config.distance.type ),
				window.utils.makeDistance( self.config.distance.value, self.config.distance.type ),
				window.utils.makeDistance( self.config.distance.value, self.config.distance.type )
			);
		} else {

			// show the planet system from 'top'
			this.camera.position.set(
				0,
				window.utils.makeDistance( self.config.distance.value, self.config.distance.type ),
				0
			);
		}
		
		this.scene.add(this.camera);
		this.controls = new THREE.TrackballControls( this.camera, this.container );

		if (target !== undefined || target != null) {
			console.log('defining new camera target', target);
			this.camera.position.set(
				target.x + window.settings.camera.planetDistance,
				target.y + window.settings.camera.planetDistance,
				target.z + window.settings.camera.planetDistance
			);

			this.controls.target = target;
			this.camera.lookAt(target);
		} else {
			var vector = new THREE.Vector3(0,0,0);
			this.controls.target = vector;
			this.camera.lookAt(vector);
		}

	  this.controls.rotateSpeed = 1.0;
	  this.controls.zoomSpeed = 1.2;
	  this.controls.panSpeed = 0.8;

	  //this.controls.noZoom = false;
	  //this.controls.noPan = false;

	  this.controls.staticMoving = true;
	  this.controls.dynamicDampingFactor = 0.3;

	  //this.controls.keys = [ 65, 83, 68 ];
	  this.controls.addEventListener( 'change', this.render.bind(this) );

		// transparently support window resize
		THREEx.WindowResize.bind(this.renderer, this.camera);
  },

  initLighting: function() {

  	// create a point light
	  this.pointLight = new THREE.PointLight(0xFFFFFF, 1);
	  this.pointLight.position.set(0, 0, 0);
	  this.scene.add( this.pointLight );

	  // add a very light ambient light
	  var globalLight = new THREE.AmbientLight(0xccffcc);
	  globalLight.color.setRGB( 
	  	window.settings.globalLightIntensity,
	  	window.settings.globalLightIntensity,
	  	window.settings.globalLightIntensity
	  );

	  this.scene.add( globalLight );
  },

  animate: function ( step ){
  	this.timeElapsed = step;

    // loop on request animation loop
		// - it has to be at the begining of the function
		// - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
		requestAnimationFrame( this.animate.bind( this ) );
		this.controls.update();

		if (this.systems.length > 0) {
			_.each( this.systems, function( system, index ){
				system.group.traverse(function(child) { 
			    if (child.animate)
						child.animate();
				});
			});
	  }

	  // set the time
	  this.lastTime = this.time;
	  this.time = Date.now();
	  this.dt = this.time - this.lastTime;
	  this.simTime += this.dt * this.currentSpeed;
	  this.date = new Date(this.simTime);
	  this.simTimeSecs = this.simTime;

		// do the render
		this.render();

		// update stats
		if (this.config.settings.stats)
			window.utils.stats.update();
  },

  render: function(){
		var self = this;

		// this.renderCount++;
		var now = _.now();
		var currentDate = new Date(now - this.startTime);
		var secondsElapsed = currentDate.getSeconds();
		var minutesElapsed = currentDate.getMinutes();
		// console.log('time since app start', minutesElapsed + 'm ' + secondsElapsed + 's');

		this.currentRenderLoops++;

		// calculate current distance from solar center
		this.cameraPosition = new THREE.Vector3();
		this.cameraPosition = this.cameraPosition.getPositionFromMatrix( this.camera.matrixWorld );

		// distance in px
		this.distanceCamera = this.cameraPosition.distanceTo( self.cameraTarget );
		var distanceSolarCenter = this.distanceCamera * window.settings.distancePixelRatio;

		var distanceAU = parseFloat(distanceSolarCenter / window.settings.AU).toFixed(2);
		var distanceLY = parseFloat(distanceSolarCenter / window.settings.LY).toFixed(2);
		var distancePC = parseFloat(distanceLY / window.settings.PC).toFixed(2);

		this.currentDistanceLY = distanceLY;

		distanceSolarCenter = window.utils.numberFormat( this.distanceCamera * window.settings.distancePixelRatio );

		$('#distance-km').text( distanceSolarCenter );
		$('#distance-au').text( distanceAU );
		$('#distance-ly').text( distanceLY );
		$('#distance-pc').text( distancePC );


		// check if camera position changed and recalculate star sizes
		if (this.cameraPosition.y != this.cameraPositionOld.y) {
			this.cameraPositionOld = this.cameraPosition;
			this.timeElapsedSinceCameraMove = now;

			// clearTimeout(self.timer);
			//self.timer = setTimeout(function(){
				if (self.known_stars)
					self.known_stars.updateStarLabels();
			//}, 0);

			if (self.particleStars)
				self.particleStars.update();

			if (self.galaxySkybox)
				self.galaxySkybox.update();
		}

		// Move the camera in a circle with the pivot point in the center of this circle...
	  // ...so that the pivot point, and focus of the camera is on the center of the scene.
	  if ((now - this.timeElapsedSinceCameraMove) > 30000 && window.settings.camera.animate) {
	  	if (this.cameraHelper)
				this.cameraHelper.autoRotation();
	  }

		if (this.coordinateSystem)
			this.coordinateSystem.update();

		if (this.cameraHelper)
			this.cameraHelper.update();

		if (this.tour)
			this.tour.update();

		// show or hide the related distance rings
		_.each( this.distanceObjects, function( objects, type ){

			if( type == 'au' ) {
				_.each( objects, function( object, idx ){
					if( object.properties.distanceScale <= distanceAU && window.settings.showDistances )
						object.visible = true;

					else if( object.properties.distanceScale )
						object.visible = false;	
				});

			}

			if( type == 'lightyears') {
				_.each( objects, function( object, idx ){
					if( object.properties.distanceScale <= distanceLY && window.settings.showDistances )
						object.visible = true;

					else if( object.properties.distanceScale )
						object.visible = false;	
				});
			}

		});


		if (distanceLY >= 100000) {
			if (this.firmament)
				this.firmament.show();
		}

		if (distanceLY < 100000) {
			if (this.firmament)
				this.firmament.hide();
		}


		if (distanceLY >= 10000) {
			if (this.galaxyCluster)
				this.galaxyCluster.show();
		}

		if (distanceLY < 10000) {
			if (this.galaxyCluster)
				this.galaxyCluster.hide();
		}


		if (distanceLY >= 0.1) {
			$('#labels').hide();
			$('#star-labels').hide();
		}
		if (distanceLY < 0.1) {
			$('#labels').show();
			$('#star-labels').show();
		}


		if (distanceLY >= 1000) {
			if (this.gridPlane) {
				this.gridPlane.traverse(function(child){
					child.visible = true;
				});
			}

			if (this.galaxy)
				this.galaxy.show();
		}
		
		if (distanceLY < 1000) {
			if (this.gridPlane) {
				this.gridPlane.traverse(function(child){
					child.visible = false;
				});
			}

			if (this.galaxy)
				this.galaxy.hide();
		}


		if (distanceLY >= 100) {
			if (this.stars) {
				//this.stars.traverse(function(child){
					//child.visible = true;
				//});
			}
		}

		/*
		if( distanceLY < 1000 ) {
			if( this.galaxy && window.settings.showGalaxy == false ) {
				//window.settings.showGalaxy = false;
				this.galaxyParticles.traverse(function(child) { 
					child.visible = false;
				});

				$('#filter-galaxy').attr('checked', false);
			}
		}	
		*/

	  /*
	  _.each(this.meshes, function(mesh){
	  	if (mesh.properties.name == 'earth') {
	  		console.log(mesh.position);
	  	}
	  });
		*/

		// update label positions
		_.each(this.meshes, function( mesh, idx ) {

			if (mesh) {
				//var pos = window.utils.getPosition2D( mesh.parent.parent, self.camera, self.projector);
				var pos = window.utils.project2D( mesh, self );

				var labelID = 'object-' + mesh.name.replace(' ', '-').toLowerCase();
        		labelID = labelID.replace(' ', '-');

				$('#' + labelID).html( mesh.name );
				$('#' + labelID).css({
					'left': pos.x + window.settings.labelOffsetX + 'px',
					'top': pos.y + window.settings.labelOffsetY + 'px',
				});
			}

		});	


		//if( this.starLinesRendered ) {

			// walk throught the renderd star lines and set their opacity

			/*
			var renderIndex = renderCount;
			console.log( 'star length', this.starLines.length );

			if( renderIndex >= this.stars.length ) {
				renderIndex = 0;
			}

			console.log('renderIndex', renderIndex);

			for( var i=0; i<this.stars.length; i++ ) {
				this.starLines[ i ].material.opacity = 0.15;

				//if( i == 500 ) 
					//console.log( this.starLines[ i ] );

				if( i == renderIndex ) {
					this.starLines[ i ].needsUpdate = true;
					this.starLines[ i ].material.opacity = 0.75;
				}			
			}

		//}
		*/

		TWEEN.update();

		// render the scene
		this.renderer.render( this.scene, this.camera );
	},

	afterRender: function(){
		$('#loader').hide();
	},

	// Show the labels of the stars depending on the distance of the camera
	updateStarLabels: function( distance ){
		var self = this;

		// the maximum number of labels to show
		var maxLabels = 10;

		// tolerance to show star labels in light years
		var distanceTolerance = 25;

		// smaller then one light year
		if( distance < 1 ) {

		} else if( distance >= 100 ) {
			
			var i = 0;
			_.each( this.stars, function( star ) {

				if( 
					star.properties.distanceLY >= (distance - distanceTolerance) &&
					star.properties.distanceLY <= (distance + distanceTolerance)
				 ) {

				 	if( i <= maxLabels ) {

				 		var name = star.properties.name;
						var pos = window.utils.toXYCoords( star.position, self.camera, self.projector );

						$('.star-label-' + i).css({
							'left': pos.x + window.settings.labelOffsetX + 'px',
							'top': pos.y + window.settings.labelOffsetY + 'px',
						});
				 	}
				}

				i++;
			});	

		} else if( distance >= 1000 ) {
			$('.star-label').hide()
		}

	},

	addSolarSystem: function() {
		var self = this;

		if (self.config.settings.solarsystem) {
			var solarsystem = new Solarsystem();

			// add the solar system to the scene
			var planetSystemView = new PlanetSystemView({
				app: self,
				model: solarsystem.getData()
			});

			this.systems.push( planetSystemView );
		}
		
		/*
		// load anoth particular system randomly
		var randomSystem = this.interestingSystems[ 
			Math.round( Math.random() * (this.interestingSystems.length-1) ) 
		];

		// load planet systems dynamically
		setTimeout(function(){
			$.ajax({
			  dataType: "json",
			  url: 'data/planetsystems/' + randomSystem,
			  success: function( data ) {
			  	
			  	var planetSystemView = new PlanetSystemView({
			  		app: self,
						model: data
					});

			  	// self.system = new System( self.scene, self.meshes, self.orbits, data );
					self.systems.push( planetSystemView );
			  }
			});
		}, 1000);
		*/

	},

	loadSystem: function( system ){
		var self = this;

		if (system.get('name')) {
			var planetSystemView = new PlanetSystemView({
	  		app: self,
				model: {model: system}
			});

			self.systems.push( planetSystemView );
		}
	},

	addSystem: function( id ){
		var self = this;
		var systemRendered = false;

		// check if system already loaded
		_.each( this.systems, function( system, idx ){
			if ( parseInt(system.id) == parseInt(id) ) {
				console.log('system already rendered');
				systemRendered = true;
			}
		});

		if (!systemRendered) {
			_.each( self.planetsystems.models, function( system ){
				if ( parseInt(system.get('id')) == id ) {
					var planetSystemView = new PlanetSystemView({
			  		app: self,
						model: system.attributes
					});

					self.systems.push( planetSystemView );
				}
			});
		}

	},

	renderStars: function(){
		var self = this;

		$.ajax({
		  dataType: 'json',
		  url: 'data/stars.json?time=' + Math.random(),
		  success: function( stars ){
		  	
		  	self.loadedStars = stars;
		  	console.log('stars loaded: ', stars.length );
		  	self.particleStars = new ParticleStarsView({
		  		app: self, 
		  		stars: self.loadedStars 
		  	});
		  	self.particleStars.update();
		  	// self.coordinateSystem.renderDistanceLines();
		  }
		});

	},

	renderKnownStars: function(){
		var self = this;

		$.ajax({
		  dataType: "json",
		  url: 'data/known_stars.json?time=' + Math.random(),
		  success: function( stars ){
		  	
		  	console.log('know stars loaded: ', stars.length );
		  	self.known_stars = new StarsView({
		  		app: self, 
		  		stars: stars
		  	});
		  	
		  	self.known_stars.update();
		  }
		});

	},

	updateStars: function() {
		var self = this;

		var c = 0;

		_.each( this.stars, function( star, index ) {

			if ( c < 10 ) {
				console.log( star );

				var distance = window.utils.getDistance( self.camera.position, star.position );
				// star.x = distance / window.settings.stars.minScale;
				// star.y = distance / window.settings.stars.minScale;
				// star.z = distance / window.settings.stars.minScale;
			}
			c++;

		});

	},

	renderDistanceCircles: function(limit, type){
		var self = this;

		var object = new THREE.Object3D();
	  var distanceType = window.settings.AU;

	  if( type == 'lightyears' )
	  	distanceType = window.settings.LY;
	  
	  // make the steps every 10^x circles
		for ( var i=0; i<=5; i++ ) {

			if( i == 5 && type != 'lightyears') 
				break;

			var circleDistance = Math.pow( 10, i ) * (distanceType / window.settings.distancePixelRatio);
			var distanceStep = Math.pow( 10, i );

			var circle = new THREE.Shape();
					circle.moveTo( circleDistance, 0 );
					circle.absarc( 0, 0, circleDistance, 0, Math.PI*2, false );
			
			var points = circle.createPointsGeometry(100);

			circleLine = new THREE.Line(points, 
			  new THREE.LineBasicMaterial({ 
		      color : 0x00ffff,
		      opacity : 0.5,
		      linewidth: 1,
		      transparent: true,
		      blending: THREE.AdditiveBlending 
			  })
			);
			
			// add one distanceStep as offset to move it to the center		
			//v_circle.position.set(0, -100, 0);		
			circleLine.position.set( 0, 0, 0 );
			circleLine.rotation.set( Math.PI/2, 0, 0 );
			circleLine.visible = false;
			circleLine.properties = {};
			circleLine.properties.distanceScale = distanceStep;

			self.distanceObjects[ type ].push( circleLine );
			object.add( circleLine );	

			// for every distance create a canvas text based on a three texture
	   	var canvas = document.createElement('canvas');
	   			canvas.width = 600;
	    		canvas.height = 400;

	    var context = canvas.getContext('2d'),
		      centerX = canvas.width / 2,
		      centerY = canvas.height / 2,
		      angle = (Math.PI * 0.7),
		      radius = -520;

	    //context.clearRect(0, 0, canvas.width, canvas.height);
	    context.font = '32px Helvetica, Arial';
	    context.textAlign = 'center';
	    context.fillStyle = '#00ffff';
	    context.strokeStyle = '#00ffff';
	    context.lineWidth = 4;

	    var canvasText = distanceStep + ' astronomical unit';
	 
		  if( type == 'lightyears' )
		  	canvasText = distanceStep + ' light year';

		  if( i > 0 ) 
		  	canvasText += 's';

	    window.utils.textCircle(context, canvasText, centerX, centerY-480, radius, angle, 1);
	    context.stroke();

	    // taken from: http://stemkoski.github.io/Three.js/Texture-From-Canvas.html
			// canvas contents will be used for a texture
			var texture = new THREE.Texture(canvas); 
					texture.needsUpdate = true;
		      
	  	var material = new THREE.MeshBasicMaterial({
	  		map: texture, 
	  		color: 0x00ffff, 
	  		transparent: true,
	  		opacity: 0.75,
	  		side: THREE.DoubleSide,
	  		blending: THREE.AdditiveBlending 
	  	});

	    material.needsUpdate = true;

	    var mesh = new THREE.Mesh(
	    	new THREE.PlaneGeometry(100, 100),
	   		material
	   	);

	    mesh.properties = {};
	    mesh.properties.distanceScale = distanceStep;
	    mesh.visible = false;
			mesh.position.set(0, 0, circleDistance);
			mesh.rotation.set(-Math.PI/2, 0, 0);

			mesh.scale.x = 10.0 * ( Math.pow( 10, (i+1) ) );
			mesh.scale.y = 10.0 * ( Math.pow( 10, (i+1) ) );

			if( type == 'lightyears' ) {
				mesh.scale.x = 7.0 * ( Math.pow( 10, (i+6) ) );
				mesh.scale.y = 7.0 * ( Math.pow( 10, (i+6) ) );
			}

			this.distanceObjects[ type ].push( mesh );
			this.scene.add( mesh );
		}

		this.scene.add( object );

	},

	// change the planet sizes (default 1)
	changePlanetSizes: function( size ) {
		_.each( this.meshes, function( mesh, idx ) {

			if( size < 0 )
				size = 0;

			if( mesh.properties.type != 'star' )
				mesh.scale.set(size, size, size);

		});
	},

	moveCamera: function(){
		var self = this;

		var target = {
			x: window.settings.LY * 100000 / window.settings.distancePixelRatio,
	    y: window.settings.LY * 100000 / window.settings.distancePixelRatio,
	    z: window.settings.LY * 100000 / window.settings.distancePixelRatio 
		};

		self.cameraHelper.moveTo(self.camera.position, target, 5000);
	},

	// EVENTS
	onDocumentMouseDown: function( event ) {
		event.preventDefault();

		var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
		this.projector.unprojectVector( vector, this.camera );

		var rayCaster = new THREE.Raycaster( this.camera.position, vector.sub( this.camera.position ).normalize() );
		var intersects = rayCaster.intersectObjects( this.meshes, true );

		if ( intersects.length > 0 ) {

			console.log( 'hovered', intersects[ 0 ].object );
			// intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );

			var particle = new THREE.Particle();
			particle.position = intersects[ 0 ].point;
			particle.scale.x = particle.scale.y = 8;
			this.scene.add( particle );
			//console.log( intersects[ 0 ].object.parent.parent.position );


			this.trackingOrbit = intersects[ 0 ].object;

			//console.log( intersects[ 0 ].object.parent.parent.position );

			// move the camera to the specific space object
			//this.camera.lookAt( intersects[ 0 ].object.position );

			// move the camera to the object
			//this.camera.position.x = intersects[ 0 ].object.parent.position.x;
			//this.camera.position.y = intersects[ 0 ].object.parent.position.y;
			//this.camera.position.z = intersects[ 0 ].object.parent.position.z;

			//this.fixCameraToObject = true;
		}
	},


	onDocumentMouseMove: function( event ) {
		event.preventDefault();

		var self = this;

		var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, .5 );
		this.projector.unprojectVector( vector, this.camera );

		var rayCaster = new THREE.Raycaster( this.camera.position, vector.sub( this.camera.position ).normalize() );

		_.each( self.markers, function( marker, idx ){
			self.scene.remove( marker );
		});

		var intersects = rayCaster.intersectObjects( this.meshes, true );
		var mouse = { x: 0, y: 0, z: 1 };

		// this where begin to transform the mouse cordinates to three.js cordinates
	  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	    
	  // this vector caries the mouse click cordinates
	  var mouse_vector = new THREE.Vector3(0,0,0);
	  		mouse_vector.set( mouse.x, mouse.y, mouse.z );

	  this.projector.unprojectVector( mouse_vector, this.camera );
	  var direction = mouse_vector.sub( this.camera.position ).normalize();
	  rayCaster.set( this.camera.position, direction );
	    
		// check if the user moves the mouse over a planet or host star
		_.each( this.meshes, function( mesh, idx ){
			//console.log(mesh);
			if( mesh.position ) {
				intersects = rayCaster.intersectObject( [mesh] );

				if( intersects.length > 0 ) {
	  			console.log( intersects[ 0 ].object );
	  		}
			}
		});

		$('#tooltip').hide();
		$('#canvas').css({'opacity': 0.0});
		self.canvasElement.hideViewHelper();

		// console.log('mouse moved');

		if (window.settings.showStars && !self.isMouseOverElement(event)) {

			// check if user moves the mouse near a star
			_.each( self.stars, function( star, idx ){

				if (star) {

					var pos = window.utils.getPosition2D( star, self.camera, self.projector);

					if( pos.x >= (event.clientX - 5) && pos.x <= (event.clientX + 5) ) {
						if( pos.y >= (event.clientY - 5) && pos.y <= (event.clientY + 5) ) {
							self.canvasElement.updatePosition(pos);
							self.canvasElement.updateObjectInfo(star);
							self.canvasElement.showTooltip();
							self.canvasElement.showViewHelper();
						}
					}

				}

			});

		}

	},

	// check over which element the mouse is
	isMouseOverElement: function(event){
		el = document.elementFromPoint(event.clientX, event.clientY);
    return !$(el).is('canvas') && !$(el).hasClass('habitable-star-label');
	}
	    

});






