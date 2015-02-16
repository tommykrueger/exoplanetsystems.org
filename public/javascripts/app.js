(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
require.register("application", function(exports, require, module) {
Application = {
  initialize: function() {
    var Router = require('lib/router');
    var Settings = require('lib/settings');
    var Utils = require('lib/utils');

    // new Settings();
    // new Utils();

    this.router = new Router();
    // this.loaderView = new Loader();

    if (typeof Object.freeze === 'function') 
      Object.freeze(this);
  }
}

module.exports = Application;

});

;require.register("collections/collection", function(exports, require, module) {
var application = require('application');

module.exports = Backbone.Collection.extend({
  
});

});

;require.register("collections/constellations", function(exports, require, module) {
var Constellation = require('../models/constellation');
var Collection = require('./collection');

module.exports = Collection.extend({
  model: Constellation,
  url: 'data/constellations.json',

  initialize: function() {
    this.name = 'Constellation';
    this.data = [];

    _.bindAll(this, 'update');
  },

  update: function( node ) {
  	console.log( this );
  }

});
});

;require.register("collections/planetsystems", function(exports, require, module) {
var Planetsystem = require('../models/planetsystem');
var Collection = require('./collection');

module.exports = Collection.extend({
  model: Planetsystem,
  url: 'data/planetsystems.json?time=' + Math.random(),

  initialize: function() {
    this.name = 'Planetsystem';
    this.data = [];

    _.bindAll(this, 'remove', 'update');
  },

  remove: function( node ) {
  	//this.data.push( node );
  },

  update: function( node ) {
  	console.log( this );
  }

});
});

;require.register("collections/stars", function(exports, require, module) {
var Star = require('../models/star');
var Collection = require('./collection');

module.exports = Collection.extend({
  model: Star,
  url: 'data/stars.json?time=' + Math.random(),

  initialize: function() {
    this.name = 'Stars';
  }
});
});

;require.register("initialize", function(exports, require, module) {
var Application = require('application');

$(function() {
  Application.initialize();
  Backbone.history.start();
});

});

;require.register("lib/app", function(exports, require, module) {

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







});

;require.register("lib/geometries", function(exports, require, module) {
/**
 * Define Basis Geomentries here
 */

module.exports = Backbone.Model.extend({

  initialize: function(values){
    Backbone.Model.prototype.initialize.call(this, values);
  },

	renderDashedCircle: function( radius, color ) {

		if( color == undefined )
			color = new THREE.Color('rgba(255, 255, 255, 0.75)');

		var circleGeometry = new THREE.Geometry();
		var verticesArray = circleGeometry.vertices;
		var segments = 128;
		var angle = 2 * Math.PI / segments;

		for( var i = 0; i <= segments; i++ ) {
	    var x = radius * Math.cos(angle * i);
	    var y = radius * Math.sin(angle * i);

	    verticesArray.push( new THREE.Vector3(x, y, 0) );
		}

		// see: http://soledadpenades.com/articles/three-js-tutorials/drawing-the-coordinate-axes/
		var circleMaterial = new THREE.LineDashedMaterial({ 
			color: 0x00FF00, 
			transparent: true,
			opacity: 0.1,
			dashSize: window.settings.AU / 1000, 
			gapSize: window.settings.AU / 1000
		});

		circleGeometry.computeLineDistances();

		var circleLine = new THREE.Line(circleGeometry, circleMaterial, THREE.LinePieces);
				circleLine.position.set(0, 12, 0);
				circleLine.rotation.set( -90 * Math.PI / 180, 0, 0 );

		return circleLine;
	}

});


});

;require.register("lib/helper/CameraHelper", function(exports, require, module) {
module.exports = Backbone.Model.extend({

  initialize: function( options ){
  	this.app = options.app;
 
  	this.speed = 3000;
    this.bindObject = null;
    this.isAnimating = false;

  	_.bindAll(this, 'moveTo', 'lookTo', 'bindTo', 'update', 'updateCameraPosition', 'autoRotation');
  },

  // see: http://stackoverflow.com/questions/14567712/how-to-animate-camera-lookat-using-three-js
  moveTo: function( position, target, speed, completeCallback ) {
    var self = this;
    self.isAnimating = true;

    console.log('moving camera position');

    if (self.bindObject !== null) {
      target.x += window.settings.camera.planetDistance;
      target.y += window.settings.camera.planetDistance;
      target.z += window.settings.camera.planetDistance;
    }

  	var speed = speed || this.speed;

  	var tween = new TWEEN.Tween( position ).to( {
	    x: target.x,
	    y: target.y,
	    z: target.z
	  }, speed)
	  	.easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(function(){

        position.x = position.x;
        position.y = position.y;
        position.z = position.z;

        self.app.camera.updateProjectionMatrix();
      })
      .onComplete(function(){

        // self.app.controls.rotation.set( 0, 0, 0 );
        if (self.bindObject !== null) {
          target.x -= window.settings.camera.planetDistance;
          target.y -= window.settings.camera.planetDistance;
          target.z -= window.settings.camera.planetDistance;
          self.app.initCamera(target);

          // show child objects like moons
          try {
            self.bindObject.showChildren();
          } catch(error) {}

        } else 
          self.app.initCamera();
        
        //self.app.camera.rotation.set( 0, 0, 0 );
        //self.app.camera.position.set(target.x, target.y, target.z);
        //self.app.camera.updateProjectionMatrix();
        //self.app.controls = new THREE.TrackballControls( self.app.camera, self.app.container );
        //self.app.camera.target = new THREE.Vector3(target.x, target.y, target.z);
        //console.log(self.app.controls.target);
        //self.app.camera.lookAt(target);

        self.isAnimating = false;

        if (completeCallback)
          completeCallback();

      })
	  	.start();
  },

  lookTo: function( target, completeCallback, speed ) {
  	var self = this;
  	var speed = speed || this.speed;
    self.isAnimating = true;

    console.log('camera currently looks at', self.app.controls.target);
    console.log('camera will look at', target);

  	// vector looking to negative z-axis
  	var vector = new THREE.Vector3( self.app.controls.target.x, self.app.controls.target.y, self.app.controls.target.z );
  			vector.applyQuaternion( self.app.camera.quaternion );

  	var vector = self.app.controls.target;

  	var tween = new TWEEN.Tween( vector ).to( {
	    x: target.x,
	    y: target.y,
	    z: target.z
	  }, speed)
	  	.easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(function(){
      	self.app.camera.lookAt(
      		new THREE.Vector3(vector.x, vector.y, vector.z)
      	);
      	
      	self.app.controls.target = new THREE.Vector3(vector.x, vector.y, vector.z);
        self.app.camera.updateProjectionMatrix();
      })
      .onComplete(function(){
        //self.app.controls.reset();
        self.app.controls.target = new THREE.Vector3(vector.x, vector.y, vector.z);

        self.app.camera.lookAt(self.app.controls.target);
        self.app.camera.updateProjectionMatrix();

        console.log('starting callback', completeCallback);
        self[completeCallback](self.app.camera.position, target);
      })
	  	.start();
  },

  bindTo: function( object, target ){
    this.bindObject = object;
    this.lookTo(target, 'moveTo');
  },

  update: function(){
    if (this.bindObject != null && !this.isAnimating) {
      this.updateCameraPosition(this.bindObject.object.properties.position);
    }
  },

  updateCameraPosition: function(target) {
    this.app.camera.lookAt(target);
    this.app.camera.updateProjectionMatrix();
  },

  autoRotation: function(){
    // only accept auto rotation if there is no object bound;
    if (this.bindObject === null) {
      var x = this.app.camera.position.x;
      var y = this.app.camera.position.y;
      var z = this.app.camera.position.z;

      var rotSpeed = 0.0005;

      this.app.camera.position.x = x * Math.cos(rotSpeed) + z * Math.sin(rotSpeed);
      this.app.camera.position.z = z * Math.cos(rotSpeed) - x * Math.sin(rotSpeed);
      this.app.camera.lookAt(this.app.cameraTarget);
    }
  }  

});

});

;require.register("lib/helper/CanvasElement", function(exports, require, module) {

var TooltipView = require('../../views/tooltip_view');
var InfoboxView = require('../../views/infobox_view');

module.exports = Backbone.View.extend({

  events: {},

  initialize: function( options ){
  	this.app = options.app;
    this.model = options.object;
    this.pos = options.pos;
    this.type = options.type;

    this.clicked = false;

    this.viewHelperGroup = new THREE.Object3D();
    
  	_.bindAll(this, 'render', 'showTooltip', 'updatePosition', 'updateObjectInfo', 'showViewHelper', 'hideViewHelper');

    this.render();
  },

  render: function() {
    var self = this;

  	// render a canvas circle at the screen position
    self.canvas = document.getElementById('canvas');
    self.canvas.width = 24;
    self.canvas.height = 24;

    var context = self.canvas.getContext('2d');
        context.beginPath();
        context.arc(12, 12, 11, 0, 2 * Math.PI, false);
        context.lineWidth = 2;
        context.strokeStyle = '#99FF66';
        context.stroke();

    // add click event (dirty)
    $(document).on('click', '#canvas', function(e){

      // dirty: prevent multiple click events
      if (!self.clicked) {
        self.clicked = true;
        e.preventDefault();
        e.stopPropagation();

        // move the camera to the star
        // self.app.cameraHelper.lookTo(self.model.position, 'moveTo');
        self.infobox = new InfoboxView({
          app: self.app,
          data: self.model.properties,
          template: 'star-info'
        });
      }

      self.clicked = false;
    });

  },

  showTooltip: function(){
    var self = this;
    self.tooltip = new TooltipView({
      pos: self.pos,
      data: self.model.properties
    });
  },

  updatePosition: function(pos){
    this.pos = pos;
    $('#canvas').css({
      'left': pos.x - 12 + 'px',
      'top': pos.y - 12 + 'px',
      'opacity': 1.0
    });
  },

  updateObjectInfo: function(objectInfo){
    this.model = objectInfo;
  },

  showViewHelper: function(){
    var self = this;
    
    self.hideViewHelper();
    self.viewHelperGroup = new THREE.Object3D();

    if (self.app.currentDistanceLY >= 1) {
      console.log('showing helper lines');
      var pos = self.model.properties.position;

      // show two lines
      var material = new THREE.LineBasicMaterial({
        color: 0x0090ff,
        linewidth: 1
      });

      // define the geometry shape
      var geometry = new THREE.Geometry();
          geometry.vertices.push( new THREE.Vector3(0, 0, 0) );
          geometry.vertices.push( new THREE.Vector3(pos.x, 0, pos.z) );

      var line1 = new THREE.Line(geometry, material);

      var geometry = new THREE.Geometry();
          geometry.vertices.push( new THREE.Vector3(pos.x, 0, pos.z) );
          geometry.vertices.push( new THREE.Vector3(pos.x, pos.y, pos.z) );

      var line2 = new THREE.Line(geometry, material);

      var geometry = new THREE.Geometry();
          geometry.vertices.push( new THREE.Vector3(0, 0, 0) );
          geometry.vertices.push( new THREE.Vector3(pos.x, pos.y, pos.z) );

      var line3 = new THREE.Line(geometry, material);

      self.viewHelperGroup.add(line1);
      self.viewHelperGroup.add(line2);
      self.viewHelperGroup.add(line3);

      self.app.scene.add(self.viewHelperGroup);

    }
  },

  hideViewHelper: function() {
    this.app.scene.remove(this.viewHelperGroup);
  }

});

});

;require.register("lib/math", function(exports, require, module) {
/**
 * Math functions that are useful to calculate bodies in space
 */

window.spaceMath = {

	toRad: function( a, b ) {
	  return a + Math.random() * ( b - a );
	},

	toDeg: function() {

	}

}








});

;require.register("lib/router", function(exports, require, module) {
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

});

;require.register("lib/settings", function(exports, require, module) {
window.settings = {

	defaultRotationSpeed: 0.0005,

	// ambient light intensity of global
	globalLightIntensity: 0.1,

	// the default speed of the app, can be adjusted dynamically
	// simulation speed can be changed to:
	//   1s -> 1day
	//   1s -> 1week
	//   1s -> 1month
	//   1s -> 1year  
	// speed = (60 * 60 * 24); // 1s in vis is 1 day in realtime

	// Global settings

	// 1 AU (astronomical unit) in km
	AU: 149597870.700,

	// the distance for one light year in km
	LY: 9460730472580.800,

	// the distance of one parsec in light years
	PC: 3.26156,

	// define how large 1px is in comparison to the the real sizes
	// every distance will be divided by this value
	distancePixelRatio: 25000,

	// define how large the objects radius should be. The objects radius
	// will be divided by this value

	// For planets
	radiusPixelRatio: 1000,

	// For stars
	radiusStarPixelRatio: 10000,

	// solar system settings
	renderSystemPlane: true,

	planets: {
		defaultColor: [0, 0, 200]
	},

	// earth radius in km
	radiusEarth: 6371,
	massEarth: 1,

	// jupiter radius in km
	radiusJupiter: 69911,

	// orbit parameters
	orbitColor: 0x9090bb,
	orbitHoverColor: 0xffffff,
	orbitTransparency: 0.5,
	orbitStrokeWidth: 1,

	// set the default rotation time in days for stars
	defaultStarRotationPeriod: 25.00,

	showOrbits: true,
	showInclination: true,
	showStars: true,
	showGalaxy: true,
	showDistances: true,

	// habitableZoneColor = 0x66CCFF;
	habitableZoneColor: 0x008000,


	// Orbit colors are used every time another
	// system was added to the scene
	orbitColors: [
		0xD59C6F,
		0x88bf8b,
		0x4682b4,
		0xd2691e,
		0xf0e68c,
		0xffa500,
		0xE89296,
		0x92DEE8,
		0x55732D,
		0x0FF7E8,

		0xE3B1E0,
		0xCA8E40,
		0x983315,
		0xA06E00,
		0xFFB100,
		0xFF6202,
		0x00579E,
		0x9E600A,
		0xFFA301,
		0x913E20
	],


	// kelvin to degrees factor
	Kelvin: -272.15,

	// labels (in px)
	labelOffsetX: 6,
	labelOffsetY: 2,

	// Stefan Boltzmann constant (formerly used hor HZ calculation)
	// Boltzmann = 5.67 * Math.pow(10, -8);

	radiusSun: 696342, // km
	tempSun: 5777, // kelvin
	lumSun: 26.5842,

	// in AU - approximated min/max distance from sun in which 
	// liquid water may exist on the planets surface and green 
	// house effect is not too strong
	// minHZ = 0.7; // AU
	// maxHZ = 1.4; // AU

	// for optimistic HZ approximation
	// minHZ = 0.84;
	// maxHZ = 1.7;

	// for pessimistic HZ approximation
	minHZ: 0.95, // AU
	maxHZ: 1.4, // AU

	// Derived from http://en.wikipedia.org/wiki/Stellar_classification
	spectralNames: {
		'o': 'Blue Giant',
		'b': 'Blue Giant',
		'a': 'White Giant',
		'f': 'Red Giant',
		'g': 'Sunlike',
		'k': 'Red Giant',
		'm': 'Red Dwarf',
		'l': 'Brown Dwarf',
		't': 'Brown Dwarf',
		'y': 'Brown Dwarf'
	},

	spectralColors: {
		'o': 0x9BB0FF, // blue
		'b': 0xBBCCFF, // blue white
		'a': 0xFBF8FF, // white
		'f': 0xFFFFF0, // yellow white
		'g': 0xFFFF00, // yellow
		'k': 0xFF9833, // orange
		'm': 0xBB2020, // red
		'l': 0xA52A2A, // red brown
		't': 0x964B00, // brown
		'y': 0x663300  // dark brown
	},

	galaxyStarColors: [

		// blue
		{ type: 'o', color: 0x9BB0FF },

		// blue white
		{ type: 'b', color: 0xBBCCFF },
		
		// white
		//{ type: 'a', color: 0xFBF8FF },

		// yellow white
		//{ type: 'f', color: 0xFFFFF0 },

		// yellow
		{ type: 'g', color: 0xFFFFBB },

		// orange
		//{ type: 'k', color: 0xFF9833 },

		// red
		{ type: 'm', color: 0xCB6040 },

		// red brown
		//{ type: 'l', color: 0xA52A2A }, 

		// brown
		//{ type: 't', color: 0x964B00 }, 

		// dark brown
		//{ type: 'y', color: 0x663300 }  
	],


	// filter settings
	filters: {
		habitableZones: false
	},

	// language settings
	defaultlanguage: 'en',

	camera: {
		animate: true,
		planetDistance: 100
	},

	stars: {

		// can be "normalized sizes" or "relative sizes"
		appearance: 'normalized sizes',

		minPlanets: 1,
		maxPlanets: 20,
		minDistance: 0,
		maxDistance: 50000,

		// minimum size of 100 px on screen
		size: 1000000000,

		// the minimum size in pixels the star should be visible
		minSize: 12,
		maxSize: 6
	},

	galaxy: {
		planeRotation: 63,

		// the distance of the galactical cnénter to the sun in light years
		centerDistance: - this.LY * 28000 / this.distancePixelRatio
	},

	toRad: function() { return Math.PI / 180; },

	galaxyPlaneRotation: function () { 
		return -90 + this.galaxy.planeRotation * this.toRad() 
	}

}


});

;require.register("lib/shaders", function(exports, require, module) {

module.exports = Backbone.Model.extend({

  initialize: function(values){
    Backbone.Model.prototype.initialize.call(this, values);

    this.folder = 'data/shaders/';

    this.data = {
      'stars': {
        vertex: '',
        fragment: ''
      },
      'starnames': {
        vertex: '',
        fragment: ''
      },
      'galaxy': {
        vertex: '',
        fragment: ''
      },
      'galaxydust': {
        vertex: '',
        fragment: ''
      },
      'galaxyclusters': {
        vertex: '',
        fragment: ''
      },
      'firmament': {
        vertex: '',
        fragment: ''
      }
    };

  },

  fetch: function(){
    var self = this;
    _.each(self.data, function(value, shader){
      self.loadShader( shader, value, 'vertex' );
      self.loadShader( shader, value, 'fragment' );
    });
  },

  // load the shader with ajax
  loadShader: function( shader, data, type ) {
  	var self = this;

    $.ajax({
      url: self.folder + shader + '-' + type + '.js',
      type: 'GET',
      dataType: 'text',
      async: false,
      complete: function( response ) {
        data[type] = response.responseText;
      }
    });

  }

});

});

;require.register("lib/textures", function(exports, require, module) {
/**
 * Define Basis Geomentries here
 */

module.exports = Backbone.Model.extend({

  initialize: function(values){
    Backbone.Model.prototype.initialize.call(this, values);
  },

  getStarMaterial: function( showShininess ) {
	
		// create the star texture
		var canvas = document.createElement( 'canvas' );
				canvas.width = 256;
				canvas.height = 256;

		//var col = new THREE.Color(color);
		var context = canvas.getContext( '2d' );

		var gradient = context.createRadialGradient( 
			canvas.width / 2, 
			canvas.height / 2, 
			0, 
			canvas.width / 2, 
			canvas.height / 2, 
			canvas.width / 2 
		);

		gradient.addColorStop( 0, 'rgba(255, 255, 255, 1.0)');
		gradient.addColorStop( 0.05, 'rgba(205, 205, 224, 1.0)');
		gradient.addColorStop( 0.1, 'rgba(125, 100, 0, 0.35)' );
		gradient.addColorStop( 1.0, 'rgba(0,0,0,0.0)' );

		context.fillStyle = gradient;
		context.fillRect( 0, 0, canvas.width, canvas.height );

		if( showShininess ) {
			context.beginPath();
			context.lineWidth = 2;

			// top - bottom 
      context.moveTo(canvas.width/2, 0);
      context.lineTo(canvas.width/2, canvas.height);

      // left - right
      context.moveTo(0, canvas.height/2);
      context.lineTo(canvas.width, canvas.height/2);

      // set line color
      context.strokeStyle = 'rgba(255,255,255,0.75)';
      context.stroke();
		} 

		var texture = new THREE.Texture(canvas); 
				texture.needsUpdate = true;

		return texture;
	},

	getGalaxyStarMaterial: function() {
	
		// create the star texture
		var canvas = document.createElement( 'canvas' );
				canvas.width = 256;
				canvas.height = 256;

		//var col = new THREE.Color(color);
		var context = canvas.getContext( '2d' );

		var gradient = context.createRadialGradient( 
			canvas.width / 2, 
			canvas.height / 2, 
			0, 
			canvas.width / 2, 
			canvas.height / 2, 
			canvas.width / 2 
		);

		gradient.addColorStop( 0, 'rgba(255, 255, 255, 0.8)');
		gradient.addColorStop( 0.1, 'rgba(200, 200, 200, 0.8)');
		gradient.addColorStop( 0.5, 'rgba(125, 100, 0, 0.5)' );
		gradient.addColorStop( 1.0, 'rgba(0,0,0,0.0)' );

		context.fillStyle = gradient;
		context.fillRect( 0, 0, canvas.width, canvas.height );

		var texture = new THREE.Texture(canvas); 
				texture.needsUpdate = true;

		return texture;
	},

	getHabitableStarMaterial: function(){

		var canvas = document.createElement( 'canvas' );
				canvas.width = 256;
				canvas.height = 256;

		var context = canvas.getContext( '2d' );

		var gradient = context.createRadialGradient( 
			canvas.width / 2, 
			canvas.height / 2, 
			0, 
			canvas.width / 2, 
			canvas.height / 2, 
			canvas.width / 2 
		);

		gradient.addColorStop( 0, 'rgba(255, 255, 255, 0.0)');
		gradient.addColorStop( 0.75, 'rgba(255, 255, 255, 0.0)' );
		gradient.addColorStop( 0.76, 'rgba(255, 255, 255, 0.5)' );
		gradient.addColorStop( 0.80, 'rgba(255, 255, 255, 0.5)' );
		gradient.addColorStop( 0.81, 'rgba(255, 255, 255, 0.0)' );
		gradient.addColorStop( 1.0, 'rgba(0, 0, 0, 0.0)' );

		context.fillStyle = gradient;
		context.fillRect( 0, 0, canvas.width, canvas.height );

		var texture = new THREE.Texture(canvas); 
				texture.needsUpdate = true;

		return texture;

	},

	starCluster: function(){

		// create the star texture
		var canvas = document.createElement('canvas');
				canvas.width = 256;
				canvas.height = 256;

		var context = canvas.getContext( '2d' );

		var gradient = context.createRadialGradient( 
			canvas.width / 2, 
			canvas.height / 2, 
			0, 
			canvas.width / 2, 
			canvas.height / 2, 
			canvas.width / 2 
		);

		gradient.addColorStop( 0, 'rgba(255, 255, 255, 0.8)');
		gradient.addColorStop( 0, 'rgba(190, 190, 190, 0.5)');
		gradient.addColorStop( 0.25, 'rgba(100, 100, 100, 0.6)');
		gradient.addColorStop( 0.5, 'rgba(100, 100, 100, 0.35)');
		gradient.addColorStop( 1.0, 'rgba(0, 0, 0, 0.25)');

		context.fillStyle = gradient;
		context.fillRect( 0, 0, canvas.width, canvas.height );

		var texture = new THREE.Texture(canvas); 
				texture.needsUpdate = true;

		return texture;

	},


	galaxyPlaneTexture: function(){

		// create the star texture
		var canvas = document.createElement( 'canvas' );
				canvas.width = 256;
				canvas.height = 256;

		var context = canvas.getContext( '2d' );

		var gradient = context.createRadialGradient( 
			canvas.width / 2, 
			canvas.height / 2, 
			0, 
			canvas.width / 2, 
			canvas.height / 2, 
			canvas.width / 2 
		);

		// the galaxy should hav white color in the center and outside blue

		// yellow galaxy colors
		//gradient.addColorStop( 0, 'rgba(255, 255, 255, 0.95)');
		//gradient.addColorStop( 0.1, 'rgba(205, 205, 224, 0.9)');
		//gradient.addColorStop( 0.5, 'rgba(125, 100, 0, 0.75)' );
		//gradient.addColorStop( 1.0, 'rgba(0,0,0,0.5)' );

		// blue galaxy colors
		gradient.addColorStop( 0, 'rgba(255, 255, 255, 0.95)');
		gradient.addColorStop( 0.2, 'rgba(189, 217, 231, 0.8)');
		gradient.addColorStop( 0.3, 'rgba(189, 217, 231, 0.6)');
		gradient.addColorStop( 0.35, 'rgba(189, 217, 231, 0.8)');
		gradient.addColorStop( 0.42, 'rgba(189, 217, 231, 0.6)');
		gradient.addColorStop( 0.70, 'rgba(189, 217, 231, 0.65)');
		gradient.addColorStop( 1.0, 'rgba(32, 65, 75, 0.0)');

		context.fillStyle = gradient;
		context.fillRect( 0, 0, canvas.width, canvas.height );

		var texture = new THREE.Texture(canvas); 
				texture.needsUpdate = true;

		return texture;

	},


	// taken from http://www.fascinatedwithsoftware.com/blog/post/2012/11/03/How-to-Draw-a-Star-with-HTML5.aspx
	drawStar: function(xCenter, yCenter, nPoints, outerRadius, innerRadius) {

		var canvas = document.createElement( 'canvas' );
				canvas.width = 256;
				canvas.height = 256;

		var context = canvas.getContext( '2d' );
	  		context.beginPath();

	  for (var ixVertex = 0; ixVertex <= 2 * nPoints; ++ixVertex) {
	    var angle = ixVertex * Math.PI / nPoints - Math.PI / 2;
	    var radius = ixVertex % 2 == 0 ? outerRadius : innerRadius;

	    context.lineTo(xCenter + radius * Math.cos(angle), yCenter + radius * Math.sin(angle));
	  }

	  var texture = new THREE.Texture(canvas); 
				texture.needsUpdate = true;

		return texture;
  },

  drawCircle: function(){

  	var canvas = document.createElement('canvas');
  			canvas.width = 256;
				canvas.height = 256;

    var context = canvas.getContext('2d');
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radius = 20;

  	context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = 'green';
    context.fill();
    context.lineWidth = 5;
    context.strokeStyle = '#003300';
    context.stroke();

    context.fillRect( 0, 0, canvas.width, canvas.height );

   	var texture = new THREE.Texture(canvas); 
				texture.needsUpdate = true;

		return texture;
  }
  

});

});

;require.register("lib/utils", function(exports, require, module) {
window.utils = {

	rand: function( a, b ) {
	  return a + Math.random() * ( b - a );
	},

	renderStats: function( container ) {

		// add Stats.js - https://github.com/mrdoob/stats.js
		this.stats = new Stats();

		$(this.stats.domElement).css({
			'position': 'absolute',
			'bottom': '0px',
			'z-index': 99
		});

		if( container )
			container.append( this.stats.domElement );
		else
			$('body').append( this.stats.domElement );

	},

	// see: https://gist.github.com/trongthanh/1294618
	project3DTo2D: function( vector, app ){
		
		// project vector from 3d to 2d
		var pos3D = new THREE.Vector3(vector.x, vector.y, vector.z);
		var pos2D = app.projector.projectVector( pos3D, app.camera );

		// set the screen dimensions depending on the current window dimensions
		pos2D.x = (pos2D.x + 1)/2 * window.innerWidth;
		pos2D.y = - (pos2D.y - 1)/2 * window.innerHeight;

		return pos2D;
	},

	// taken from: https://github.com/mrdoob/three.js/issues/78
	toScreenXY: function ( position, camera ) {

	    var pos = position.clone();
	    projScreenMat = new THREE.Matrix4();
	    projScreenMat.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
	    // projScreenMat.multiplyVector3( pos );

	    pos.applyMatrix4( projScreenMat );

	    return { 
	    	x: ( pos.x + 1 ),
	      y: ( - pos.y + 1)
	    };

	},

	// see: http://stackoverflow.com/questions/15248872/dynamically-create-2d-text-in-three-js
	toXYCoords: function(pos, camera, projector) {
		camera.updateMatrixWorld();
		pos = position.getPositionFromMatrix( pos.matrixWorld );
		var vector = projector.projectVector(pos.clone(), camera);
		vector.x = (vector.x + 1)/2 * window.innerWidth;
		vector.y = -(vector.y - 1)/2 * window.innerHeight;
		return vector;
	},

	// project a 3D vector to a 2D vector depending on the camera angle
	project2D: function(mesh, app) {

		app.scene.updateMatrixWorld(true);

		position = new THREE.Vector3();
		pos = position.getPositionFromMatrix( mesh.matrixWorld );
		
		app.camera.updateMatrixWorld(true);

		// var vector = app.projector.projectVector(pos.clone(), app.camera);
		var vector = app.projector.projectVector(pos.clone(), app.camera);

		vector.x = (vector.x + 1)/2 * window.innerWidth;
		vector.y = -(vector.y - 1)/2 * window.innerHeight;

		return vector;
	},

	// get the distance between two vectors in the scene
	// taken from http://ptn.github.io/kepler/app/kepler.js
	getDistance: function( vector1, vector2 ) {
		var x = vector1.x - vector2.x;
	  var y = vector1.y - vector2.y;
	  var z = vector1.z - vector2.z;
	  
	  return Math.sqrt(x * x + y * y + z * z);
	},


	getDimensionToTen: function( min, max ) {

		var size = Math.ceil( max * 100000 ) / 100000;

		if( max < 0.001 )
			size = Math.ceil( max * 10000 ) / 10000;
		else if( max < 0.01 )
			size = Math.ceil( max * 1000 ) / 1000;
		else if( max < 0.1 )
			size = Math.ceil( max * 100 ) / 100;
		else if( max < 1 )
			size = Math.ceil( max * 10 ) / 10;

		else {
			size = Math.ceil( max );
		}

		return {
			size: size,
			max: max,
			min: min,
			minPercent: Math.round(min * 100 / size) / 100,
			maxPercent: Math.round(max * 100 / size) / 100
		}

	},


	// taken from: http://zachberry.com/blog/tracking-3d-objects-in-2d-with-three-js/
	getPosition2D: function( object, camera, projector){

		var p, v, percX, percY, left, top;

		// this will give us position relative to the world
		p = object.position.clone();

		// projectVector will translate position to 2d
		v = projector.projectVector(p, camera);

		// Pick a point in front of the camera in camera space:
		var pLocal = new THREE.Vector3(0, 0, -1);

		// Now transform that point into world space:
		var pWorld = pLocal.applyMatrix4( camera.matrixWorld );
		
		// You can now construct the desired direction vector:
		var dir = pWorld.sub( camera.position ).normalize();

		var scalar = (p.x - camera.position.x) / dir.x;
		//console.log( scalar );

	  if(scalar < 0) {
	  	//console.log('object behind camera');
	  	return false; //this means the point was behind the camera, so discard
	  }
		//console.log( v );

		// translate our vector so that percX=0 represents
		// the left edge, percX=1 is the right edge,
		// percY=0 is the top edge, and percY=1 is the bottom edge.
		percX = (v.x + 1) / 2;
		percY = (-v.y + 1) / 2;

		// scale these values to our viewport size
		left = percX * window.innerWidth;
		top = percY * window.innerHeight;

		return { x: left, y: top };
	},

	// taken from: http://stackoverflow.com/questions/3177855/how-to-format-numbers-similar-to-stack-overflow-reputation-format
	numberFormat: function(number) {
		var repString = number.toString();

	  if ( number < 1000 ) {
			repString = number;
	  } else if ( number < 1000000 ) {
			repString = (Math.round((number / 1000) * 10) / 10) + ' K'
	  } else if ( number < 1000000000 ) {
			repString = (Math.round((number / 1000000) * 10) / 10) + ' Mio'
	  } else if ( number < 1000000000000000000 ) {
			repString = (Math.round((number / 1000000000) * 10) / 10) + ' Bio'
	  }

	  return repString;
	},

	// takes a hex string (6 characters) and returns rgb components as object
	hexToRGB: function( hex ){

		var r = parseInt( hex.substring(0,2), 16);
		var g = parseInt( hex.substring(2,4), 16);
		var b = parseInt( hex.substring(4,6), 16);

		return rgb = {
			r: r,
			g: g,
			b: b
		}
	},

	// taken from: http://www.html5canvastutorials.com/labs/html5-canvas-text-along-arc-path/
	drawTextAlongArc: function( context, str, centerX, centerY, radius, angle ) {
	  var len = str.length, s;
	  context.save();
	  context.translate(centerX, centerY);
	  context.rotate(-1 * angle / 2);
	  context.rotate(-1 * (angle / len) / 2);
	  for(var n = 0; n < len; n++) {
	    context.rotate(angle / len);
	    context.save();
	    context.translate(0, -1 * radius);
	    s = str[n];
	    context.fillText(s, 0, 0);
	    context.restore();
	  }
	  context.restore();
	},


	// taken from: http://jsfiddle.net/Brfp3/3/
	textCircle: function(ctx, text, x, y, radius, space, top){
	   space = space || 0;
	   var numRadsPerLetter = (Math.PI - space * 2) / text.length;
	   ctx.save();
	   ctx.translate(x,y);
	   var k = (top) ? 1 : -1; 
	   ctx.rotate(-k * ((Math.PI - numRadsPerLetter) / 2 - space));
	   for(var i=0;i<text.length;i++){
	      ctx.save();
	      ctx.rotate(k*i*(numRadsPerLetter));
	      ctx.textAlign = "center";
	     	ctx.textBaseline = (!top) ? "top" : "bottom";
	     	ctx.fillText(text[i],0,-k*(radius));
	      ctx.restore();
	   }
	   ctx.restore();
	},


	getRandomRange: function(min, max) {
	  return Math.random() * (max - min) + min;
	},

	makeDistance: function( distance, distanceType ) {

		if (distanceType.toLowerCase() == 'ly') {
			return (distance * window.settings.LY / window.settings.distancePixelRatio);
		}	

		if (distanceType.toLowerCase() == 'au') {
			return (distance * window.settings.AU / window.settings.distancePixelRatio);
		}

		else
			console.log('wrong distance type');
	},

	toggleInclination: function( meshes ){
		_.each( this.meshes, function( mesh, idx ) {
			if( mesh.properties.type != 'star' )
				mesh.rotation.set(0, 0, 0);
		});
	}
}








});

;require.register("models/constellation", function(exports, require, module) {
var Model = require('./model');

module.exports = Model.extend({

	intitialize : function(values){
		Model.prototype.initialize.call(this, values);
	}

});
});

;require.register("models/model", function(exports, require, module) {
// Base class for all models.
module.exports = Backbone.Model.extend({
  initialize: function(values){
    Backbone.Model.prototype.initialize.call(this, values);
  },

  // Generates a JSON representation of this model
  toJSON: function(){
    var data = Backbone.Model.prototype.toJSON.call(this);
    return data;
  }

});

});

;require.register("models/particle", function(exports, require, module) {

module.exports = Backbone.Model.extend({

  initialize: function( options ){

    // define the position of the particle
		this.position = options.vector;

		// initialize size with init value
		this.size = 256;

		// field for additional 
		this.properties = {};
  }

});

});

;require.register("models/planetsystem", function(exports, require, module) {
var Model = require('./model');

module.exports = Model.extend({

	intitialize : function(values){
		Model.prototype.initialize.call(this, values);
	}

});
});

;require.register("models/solarsystem", function(exports, require, module) {

var Model = require('./model');

module.exports = Model.extend({

	intitialize : function(values){
		
		_.bindAll(this, 'getData');

		// Model.prototype.initialize.call(this, values);
	},

	defaults: {
		name: 'Solarsystem',
		radius: 100000,
		stars: [
			{
				name: 'Sun',
				type: 'star',
				radius: 1,
				spec: 'G',
				dist: 0.000015813,
				temp: 5777,
				minhz: 0.950,
				maxhz: 1.670,
				rotationPeriod: 24.47,
				planets: 8,
				texture: 'sun.png'
			}
		],
		satellites: [
			{ // finish
				name: 'Mercury',
				type: 'planet',
				radius: 2439.7,
				//position: [750, 0, 0],

				semiMajorAxis: 57909100,
				eccentricity: 0.2056,
				inclination: 7.00,
				siderealOrbitPeriod: 87.969,
				rotationPeriod: 0,
				longitudeAscendingNode: 48.331,

				temp: 440,
				masse: 0.055,
				habitable: 0,
				esi: 0.596,
				habitableMoon: 0,
				method: 'observation',
				year: '1400 BC',

				texture: 'mercury.jpg',
			},
			{ // finish
				name: 'Venus',
				type: 'planet',
				radius: 6051.8,
				//position: [750, 0, 0],

				semiMajorAxis: 108208000,
				eccentricity: 0.0068,
				inclination: 3.395,
				siderealOrbitPeriod: 224.701,
				rotationPeriod: 243.0185,
				rotationClockwise: false,
				longitudeAscendingNode: 76.678,

				orbit_color: 0xf4a460,

				temp: 737,
				masse: 0.815,
				habitable: 0,
				esi: 0.444,
				habitableMoon: 0,
				method: 'observation',
				year: '1645 BC',

				orbitSpeed: 360,
				texture: 'venus.jpg',
			},
			{ // finish
				name: 'Earth',
				type: 'planet',
				radius: 6371,
				position: [1000, 0, 0],
				rotationSpeed: 1,

				// in km (proximation)
				semiMajorAxis: 149600000,
				eccentricity: 0.0167,

				// in earth days
				siderealOrbitPeriod: 365.256,

				// degrees
				inclination: 0.0,

				// in hours min sec
				rotationPeriod: 1,

				// steelblue
				orbit_color: 0x4682b4,

				temp: 288,
				masse: 1,
				habitable: 1,
				esi: 1,
				habitableMoon: 0,
				method: '-',
				year: '-',

				texture: 'earth.jpg',
				satellites: [
					{ // finish
						name: 'Moon',
						type: 'moon',
						radius: 1737.10,
						position: [120, 0, 0],
						isSatellite: true,
						rotationSpeed: 1,
						// from earth
						semiMajorAxis: 3843990,
						eccentricity: 0.0549,
						inclination: 18.29,
						siderealOrbitPeriod: 27.321582,

						temp: 288,
						masse: 1,
						habitable: 0,
						esi: 0.559,
						habitableMoon: 0,
						method: '-',
						year: '-',

						color: [56,56,56],
						texture: 'moon.jpg'
					}
				]

			},
			{
				name: 'Mars',
				type: 'planet',
				radius: 3396.2,
				position: [1400, 0, 0],

				semiMajorAxis: 227939100,
				eccentricity: 0.0935,
				inclination: 1.85,
				siderealOrbitPeriod: 686.980,
				rotationPeriod: 1.025957,
				longitudeAscendingNode: 49.562,

				orbit_color: 0xff7f50,

				temp: 210,
				masse: 0.10745,
				habitable: 0,
				esi: 0.697,
				habitableMoon: 0,
				method: '-',
				year: '-',

				texture: 'mars.jpg'
			},
			{
				name: 'Jupiter',
				type: 'planet',
				radius: 69911,
				position: [2100, 0, 0],

				semiMajorAxis: 778500000,
				eccentricity: 0.0484,
				inclination: 1.305,
				siderealOrbitPeriod: 4332.59,
				rotationPeriod: 9.925,

				orbit_color: 0xf5deb3,

				temp: 165,
				masse: 317.84,
				habitable: 0,
				esi: 0.292,
				habitableMoon: 0,
				method: 'observation',
				year: '> 3000 BC',

				texture: 'jupiter.jpg',

				satellites: [
					{ // finish
						name: 'Io',
						type: 'moon',
						isSatellite: true,

						radius: 3643/2,
						rotationSpeed: 1, // synchronous
						semiMajorAxis: 421800,
						eccentricity: 0.004,
						inclination: 0.036,
						siderealOrbitPeriod: 1.77,

						temp: 110,
						masse: 0.015,
						habitable: 0,
						esi: 0.362,
						habitableMoon: 0,
						method: 'telescope',
						year: '1610',

						texture: 'io.jpg',
					},
					{ // finish
						name: 'Europa',
						type: 'moon',
						isSatellite: true,

						radius: 3122/2,
						rotationSpeed: 1,
						semiMajorAxis: 6711000,
						eccentricity: 0.009,
						inclination: 0.467,
						siderealOrbitPeriod: 3.55,

						temp: 102,
						masse: 0.008,
						habitable: 0,
						esi: 0.262,
						habitableMoon: 0,
						method: 'telescope',
						year: '1610',

						texture: 'moon.jpg'
					},
					{ // finish
						name: 'Ganymede',
						type: 'moon',
						isSatellite: true,

						radius: 5262/2,
						rotationSpeed: 1,
						semiMajorAxis: 10704000,
						eccentricity: 0.001,
						inclination: 0.20,
						siderealOrbitPeriod: 7.16,

						temp: 110,
						masse: 0.025,
						habitable: 0,
						esi: 0.289,
						habitableMoon: 0,
						method: 'telescope',
						year: '1610',

						texture: 'moon.jpg'
					},
					{ // finish
						name: 'Callisto',
						type: 'moon',
						isSatellite: true,

						radius: 4821/2,
						rotationSpeed: 1,
						semiMajorAxis: 18827000,
						eccentricity: 0.007,
						inclination: 0.307,
						siderealOrbitPeriod: 16.69,

						temp: 134,
						masse: 0.018,
						habitable: 0,
						esi: 0.338,
						habitableMoon: 0,
						method: 'telescope',
						year: '1610',

						texture: 'moon.jpg'
					}
				]
			},
			{ // finish
				name: 'Saturn',
				type: 'planet',
				radius: 60268,
				position: [2500, 0, 0],

				semiMajorAxis: 1433449370,
				eccentricity: 0.05648,
				inclination: 2.484,
				siderealOrbitPeriod: 10759.22,
				
				orbit_color: 0xDAB384,
				
				temp: 135,
				masse: 95.169,
				habitable: 0,
				esi: 0.246,
				habitableMoon: 0,
				method: 'observation',
				year: '> 3000 BC',

				texture: 'saturn.jpg',
				satellites: [
					{ // finish
						name: 'Titan',
						type: 'moon',
						isSatellite: true,

						radius: 2576,					
						rotationSpeed: 1,
						semiMajorAxis: 1221870,
						eccentricity: 0.0288,
						inclination: 0.34854,
						siderealOrbitPeriod: 15.945,

						temp: 93.7,
						masse: 0.0225,
						habitable: 0,
						esi: 0.242,
						habitableMoon: 0,
						method: 'telescope',
						year: '1655',

						color: [56,56,56],
						texture: 'moon.jpg'
					}
				]
			},
			{ // finish
				name: 'Uranus',
				type: 'planet',
				radius: 25559,
				position: [3100, 0, 0],

				semiMajorAxis: 2876679082,
				eccentricity: 0.0472,
				inclination: 0.770,
				siderealOrbitPeriod: 30799.095,
					
				orbit_color: 0xD3FAF9,

				temp: 76,
				masse: 14.539,
				habitable: 0,
				esi: 0.187,
				habitableMoon: 0,
				method: 'teleskope',
				year: '1781',

				color: [0,135,213],
				texture: 'uranus.jpg',
			},
			{ // finish
				name: 'Neptune',
				type: 'planet',
				radius: 24764,
				position: [3600, 0, 0],

				semiMajorAxis: 4503443661,
				eccentricity: 0.0113,
				inclination: 1.769,
				siderealOrbitPeriod: 60190.03,

				orbit_color: 0x5D8CE4,

				temp: 73,
				masse: 17.149,
				habitable: 0,
				esi: 0.184,
				habitableMoon: 0,
				method: 'telescope',
				year: '1846',
				
				texture: 'neptune.jpg',
			},

			// dwarf planets
			{ // finish
				name: 'Ceres',
				type: 'dwarf-planet',
				radius: 487.3,

				semiMajorAxis: 413910000,
				eccentricity: 0.075797,
				inclination: 10.593,
				siderealOrbitPeriod: 1680.99,
				longitudeAscendingNode: 80.3276,

				temp: 168,
				masse: 0.00015,
				habitable: 0,
				esi: 0.271,
				habitableMoon: 0,
				method: 'telescope',
				year: '1801',

				texture: 'moon.jpg',
			},
			{ // finish
				name: 'Pluto',
				type: 'dwarf-planet',
				radius: 1153,
				position: [3600, 0, 0],

				semiMajorAxis: 5908994718,
				eccentricity: 0.248807,
				inclination: 11.88,
				siderealOrbitPeriod: 90465,
				longitudeAscendingNode: 110.28683,

				temp: 44,
				masse: 0.00218,
				habitable: 0,
				esi: 0.075,
				habitableMoon: 0,
				method: 'telescope',
				year: '1930',

				texture: 'pluto.jpg',
			},
			{ // finish
				name: 'Eris',
				type: 'dwarf-planet',
				radius: 1163,
				position: [3600, 0, 0],

				semiMajorAxis: 10194533900,
				eccentricity: 0.437083,
				inclination: 43.8853,
				siderealOrbitPeriod: 205467.7296,
				longitudeAscendingNode: 36.031,

				temp: 42.5,
				masse: 0.0028,
				habitable: 0,
				esi: 0.054,
				habitableMoon: 0,
				method: 'telescope',
				year: '2005',

				texture: 'moon.jpg',
			},
			{ // finish
				name: 'Haumea',
				type: 'dwarf-planet',
				radius: 718,
				position: [3600, 0, 0],

				semiMajorAxis: 6483870900,
				eccentricity: 0.19501,
				inclination: 28.22,
				siderealOrbitPeriod: 103468,
				rotationPeriod: 0.163146,
				longitudeAscendingNode: 121.10,

				temp: 50,
				masse: 0.00066,
				habitable: 0,
				esi: 0.091,
				habitableMoon: 0,
				method: 'telescope',
				year: '2004',

				texture: 'moon.jpg',
			},
			{	// finish
				name: 'Makemake',
				type: 'dwarf-planet',
				radius: 739,

				semiMajorAxis: (6.8306 * Math.pow(10,9)),
				eccentricity: 0.159,
				inclination: 28.96,
				siderealOrbitPeriod: 113183,
				rotationPeriod: 0.32379167,
				longitudeAscendingNode: 79.382,

				temp: 36,
				masse: null,
				habitable: 0,
				esi: 0.043,
				habitableMoon: 0,
				method: 'telescope',
				year: '2005',

				texture: 'moon.jpg',
			},
			{ // finish
				name: 'Sedna',
				type: 'dwarf-planet',
				radius: 498,
				position: [3600, 0, 0],

				semiMajorAxis: (7.7576 * Math.pow(10,10)),
				eccentricity: 0.8527,
				inclination: 11.927,
				siderealOrbitPeriod: 4161000,
				rotationPeriod: 0.42,
				longitudeAscendingNode: 144.26,

				temp: 12,
				masse: 0.000167336,
				habitable: 0,
				esi: 0.013,
				habitableMoon: 0,
				method: 'telescope',
				year: '2003',

				texture: 'moon.jpg',
			},

			// comets
			{	
				name: 'Halley',
				type: 'comet',
				radius: 7.5,

				semiMajorAxis: 2667928426.0638,
				eccentricity: 0.967,
				inclination: 162.262,
				siderealOrbitPeriod: (75.32*365), // 75,32 years
				longitudeAscendingNode: 58.42,

				temp: 12,
				masse: 0.000167336,
				habitable: 0,
				esi: 0.0,
				habitableMoon: 0,
				method: 'night view',
				year: '240 BC',

				texture: 'moon.jpg',
			},
			{	
				name: 'Tempel 1',
				type: 'comet',
				radius: 7.5,

				semiMajorAxis: 469751503,
				eccentricity: 0.51159444,
				inclination: 10.50258430,
				siderealOrbitPeriod: (5.5600*365), // 5.5600 years
				longitudeAscendingNode: 68.8818134887,

				temp: 12,
				masse: 0.0,
				habitable: 0,
				esi: 0.0,
				habitableMoon: 0,
				method: 'telescope',
				year: '1995',

				texture: 'moon.jpg',
			}

		],
		asteroidbelt: [
			{
				name: 'Asteroid Belt',
				type: 'asteroid-belt',
				min: 2.06, // AU
				max: 3.3
			}
		]
	},

	getData: function(){ 
		return this.defaults;
	},

	toJSON: function(){ return this; }

});
});

;require.register("models/star", function(exports, require, module) {
var Model = require('./model');

module.exports = Model.extend({

	intitialize : function(values){
		Model.prototype.initialize.call(this, values);
	}

});
});

;require.register("views/animation_controls_view", function(exports, require, module) {
var View = require('./view');

var PopupView = require('./popup_view');

module.exports = View.extend({

	id: 'animation-controls',
  template: require('./templates/animation-controls'),

  events: {
    'click #btn-help': 'showHelp',
  	'click #btn-controls': 'toggleControlsContainer',
    'click #play-pause-btn': 'pause',
    'click .speed-btn': 'changeSpeed'
  },

  initialize: function( options ){
    this.app = options.app;

  	_.bindAll(this, 
      'showHelp',
      'toggleControlsContainer',
      'pause',
      'changeSpeed',
      'afterRender'
    );
  
  },

  afterRender: function(){
    var self = this;

    console.log('intitializing slider');

    $('#stars-distance-slider').slider({
      range: true,
      min: window.settings.stars.minDistance,
      max: window.settings.stars.maxDistance,
      step: 10,
      values: [window.settings.stars.minDistance, window.settings.stars.maxDistance],
      slide: function( event, ui ) {
        $('#stars-distance-amount').text( ui.values[0] + ' - ' + ui.values[1] + ' LY');

        window.settings.stars.minDistance = ui.values[0];
        window.settings.stars.maxDistance = ui.values[1];

        // remove all stars first
       // App.scene.remove( App.particleStars );
        //App.stars = [];
        //App.particleStars = new ParticleStars( App, App.loadedStars);  
        self.app.particleStars.filter();
        //App.particleStars.filter();     
      }
    });

  },

  showHelp: function(){
    var self = this;
     new PopupView({ app:self.app, template: 'help'});
  },

  toggleControlsContainer: function(event){
  	this.$('#animation-controls-container').toggle();
  },

  pause: function(e){
    console.log('paused');

    if (e !== undefined) {
      var self = $(e.currentTarget);

      if ( self.hasClass('paused') ) {
        this.app.currentSpeed = this.app.defaultSpeed;
        self.find('i').removeClass('fa-play');
        self.find('i').addClass('fa-pause');
        self.removeClass('paused');

      } else {
        this.app.currentSpeed = 0;
        self.find('i').removeClass('fa-pause');
        self.find('i').addClass('fa-play');
        self.addClass('paused');
      }
    } else {
      this.app.currentSpeed = 0;
      $('#play-pause-btn').find('i').removeClass('fa-pause');
      $('#play-pause-btn').find('i').addClass('fa-play');
      $('#play-pause-btn').addClass('paused');
    }
    

    $('.default-speed-btn').html( this.app.currentSpeed / this.app.defaultSpeed + '&times;');
  },


  changeSpeed: function(e){

    if( $(e.currentTarget).attr('id') == 'speed-plus' ) {
      this.app.currentSpeed *= 2;
    } else {
      this.app.currentSpeed /= 2;
    }

    console.log('set speed to', this.app.currentSpeed);

    var newSpeed = this.app.currentSpeed / this.app.defaultSpeed;

    if( newSpeed < 1 ) {
      newSpeed = newSpeed.toFixed(4);
    }

    $('.default-speed-btn').html( newSpeed + '&times;');
  },

  defaultSpeed: function(){
    console.log('set speed to', this.app.defaultSpeed);
    this.app.currentSpeed = this.app.defaultSpeed;
    $('.default-speed-btn').html( this.app.currentSpeed / this.app.defaultSpeed + '&times;');
  }

});
});

;require.register("views/asteroidbelt_view", function(exports, require, module) {
var View = require('./view');

var Textures = require('lib/textures');
var Geometries = require('lib/geometries');

module.exports = View.extend({

	id: null,
  template: null,

  initialize: function( options ){
  	// console.log( options );

  	this.app = options.app;
  	this.data = options.data;
  	this.planetsystem = options.planetsystem;
  	this.parentGroup = options.group;

  	this.animationFunctions = [];
  	this.texture = options.data.texture || false;

  	// orbit options
		this.eccentricity = options.data.eccentricity || 0.0;
		this.semiMajorAxis = options.data.semiMajorAxis || 1;
		//this.semiMinorAxis = this.semiMajorAxis * Math.sqrt( 1 - Math.pow(this.eccentricity, 2) );
		this.inclination = options.data.inclination || 0;

		this.rotationPeriod = options.data.rotationPeriod || null;
		this.rotationClockwise = options.data.rotationClockwise;
		this.longitudeAscendingNode = options.data.longitudeAscendingNode || 0;

		// assumed one erath year if not given
		this.siderealOrbitPeriod = options.data.siderealOrbitPeriod || 365;

  	this.radius = options.data.radius || window.settings.radiusEarth;
  	// console.log(this.radius);
  	if( this.data.type == 'planet' && this.radius < 1000 ) {
			this.radius *= window.settings.radiusEarth;
		}

		if (this.data.confirmed == undefined)
			this.data.confirmed = 1;

  	// used for longitude of the ascending node
		this.referencePlane = new THREE.Object3D();

		// base plane holds the orbit ellipse and inclination
		this.basePlane = new THREE.Object3D();

		// pivot holds the planet sphere shape
	  this.pivot = new THREE.Object3D();

	  // planet plane is used for additional objects like moons
	  // moons will be added as child objects to this group
		this.objectPlane = new THREE.Object3D();

  	this.referencePlane.add( this.basePlane );
		this.basePlane.add(this.pivot);
		this.pivot.add(this.objectPlane);
		this.parentGroup.add( this.referencePlane );

		this.color = new THREE.Color( window.settings.planets.defaultColor );

		if(options.data.color)
			this.color.setRGB( options.data.color[0], options.data.color[1], options.data.color[2] );

  	this.render();
		this.renderOrbit();
		this.prepareAnimations();

		_.bindAll(this, 'render');

  	return this.object;
  },

  render: function() {
  	var self = this;

  	var geometry = new THREE.SphereGeometry( this.radius / window.settings.radiusPixelRatio, 32, 32 );
		var material = new THREE.MeshLambertMaterial({ 
			color: self.color.getHex()
		});

		var planetTransparency = 1.0;
		if (!self.data.confirmed) {
			planetTransparency = 0.25;
		}
	  if( self.texture ){
	  	material = new THREE.MeshLambertMaterial({
		    map: THREE.ImageUtils.loadTexture('img/materials/'+ self.texture + ''),
		    wireframe: false,
		    transparent: true,
		    opacity: planetTransparency
		  });
	  };

	  this.object = new THREE.Mesh(geometry, material);
		this.object.name = self.data.name;
		this.object.properties = {
			name: self.data.name,
			realName: self.realName,
			radius: self.radius.toFixed(2),
			distance: (self.distance * window.settings.PC).toFixed(4),
			siderealOrbitPeriod: self.siderealOrbitPeriod,
			semiMajorAxis: self.semiMajorAxis,
			eccentricity: self.eccentricity,
			inclination: self.inclination,
			rotationPeriod: self.rotationPeriod,
			image: self.texture,
			temparature: self.data.temp,
			masse: self.data.masse,
			habitable: self.data.habitable,
			esi: self.data.esi,
			habitableMoon: self.data.habitableMoon,
			method: self.data.method,
			year: self.data.year,
			type: self.data.class,
			tempClass: self.data.tempClass,
			confirmed: self.data.confirmed
		};

		this.object.spaceRadius = self.radius / window.settings.radiusPixelRatio;
		this.objectPlane.add(this.object);
		this.planetsystem.meshes.push(this.object);
		this.app.meshes.push(this.object);

		console.log('this one is a: ' + self.data.type);

		if ( self.data.type == 'planet' || self.data.type == 'dwarf-planet' || self.data.type == 'star' || self.data.type == 'comet' ) {
			var labelView = new LabelView({ app: self.app, data: self.data, planetsystem: self.planetsystem });
			$('#labels').append(labelView.render().el);
		}


		// render planet moons

		/*
		if( self.satellites ) {
			_.each(self.satellites, function( satellite, index ){

				satellite.parentGroup = self.objectPlane;
				satellite.meshes = self.meshes;
				satellite.orbits = self.orbits;
				satellite.isSatellite = true;
				satellite.orbitColor = self.orbitColor;
				satellite.systemName = self.systemName;

				new SpaceObjectView({
					app: self.app,
					data: satellite
				});

			});	
		}
		*/

  },

  renderOrbit: function() {
  	var self = this;
	  var circle = new THREE.Shape();
	  //circle.moveTo(this.position[0], 0);

	  if( this.eccentricity >= -1 ) {

	  	// aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise
			var ellipseCurve = new THREE.EllipseCurve(
				(self.eccentricity * 100 * self.semiMajorAxis / 100) / window.settings.distancePixelRatio,
				0,
	   		self.semiMajorAxis / window.settings.distancePixelRatio, 

	   		// taken from http://en.wikipedia.org/wiki/Semi-minor_axis
				( self.semiMajorAxis * Math.sqrt(1 - Math.pow(self.eccentricity, 2) ) ) / window.settings.distancePixelRatio, 
	    	0, 
	    	2.0 * Math.PI,
	    	false
	    );

			var ellipseCurvePath = new THREE.CurvePath();
					ellipseCurvePath.add(ellipseCurve);

			var ellipseGeometry = ellipseCurvePath.createPointsGeometry(200);
					ellipseGeometry.computeTangents();

			// render solid line		
			/*
			var orbitMaterial = new THREE.LineBasicMaterial({
			  color: window.settings.orbitColors[ App.systems.length ],
			  blending: THREE.AdditiveBlending,
			  depthTest: true,
			  depthWrite: false,
			  opacity: window.settings.orbitTransparency,
				linewidth: window.settings.orbitStrokeWidth,
			  transparent: true
			});
			*/

			var orbitTransparency = window.settings.orbitTransparency;
			if (!self.data.confirmed) {
				orbitTransparency = 0.25;
			}

			var orbitColor = window.settings.orbitColors[ this.app.systems.length ];
			console.log('type', self.data.type);
			if (self.data.type == 'comet') {
				orbitColor = 0x909090;
			}

			// render dashed line
			var orbitMaterial = new THREE.LineDashedMaterial({
			  color: orbitColor,
			  blending: THREE.AdditiveBlending,
			  depthTest: true,
			  depthWrite: false,
			  opacity: orbitTransparency,
				linewidth: window.settings.orbitStrokeWidth,
			  transparent: true,
			  dashSize: window.settings.AU/10, 
			  gapSize: window.settings.AU/10 
			});

			var line = new THREE.Line(ellipseGeometry, orbitMaterial);
			
			if (!self.data.confirmed || self.data.type === 'comet') {
				ellipseGeometry.computeLineDistances();
				line = new THREE.Line(ellipseGeometry, orbitMaterial, THREE.LinePieces);
			}

			line.orbitColor = window.settings.orbitColors[ this.app.systems.length ];
			// line.orbitColorHover = window.settings.Colors[ App.systems.length ].orbitHover;

			this.referencePlane.rotation.y = this.longitudeAscendingNode * Math.PI/2;
			line.rotation.set(Math.PI/2, 0, 0);

			if( this.type != 'camera' ) {
		  	self.basePlane.add(line);
		  	self.planetsystem.orbits.push({ 
		  		line: line ,
		  		name: self.name, 
		  		type: self.type
		  	});
	  	}

		} else {

			// x, y, radius, start, end, anti-clockwise
			circle.absarc(0, 0, self.semiMajorAxis / window.settings.distancePixelRatio, 0, Math.PI*2, false);

			var points = circle.createPointsGeometry(128);
		  v_circle = new THREE.Line(
		  	points, 
				new THREE.LineBasicMaterial({ 
					//color: self.orbitColor,
					color: window.settings.orbitColors[ self.app.systems.length ],
					opacity: window.settings.orbitTransparency,
					linewidth: window.settings.orbitStrokeWidth,
					transparent: true
				})
			);

		  v_circle.rotation.set(Math.PI/2, 0, 0);

		  self.basePlane.add(v_circle);
		  self.planetsystem.orbits.push({ 
		  	line: v_circle,
		  	name: self.name, 
		  	type: self.type
		  });

		}

		this.basePlane.inclination = 1;
		this.basePlane.rendertype = 'basePlane';
		this.basePlane.rendername = this.name;

		// set the inclination
		if ( this.inclination > 0 && self.app.config.settings.inclination ) {
			this.basePlane.inclination = this.inclination;
			this.basePlane.rotation.set(this.inclination * Math.PI / 180.0, 0, 0);
		}

  },

  prepareAnimations: function(){
  	var self = this;

    // rotation of the space object
    // not all objects have self rotation, e.g. mercury and moon don't have
    // venus has a negative rotation

    self.animationFunctions.push(function() {

    	// we have rotationPeriod in earth days
    	if ( self.rotationPeriod ) {

    		if ( self.rotationClockwise === false )
					self.object.rotation.y -= self.app.currentSpeed / (24 * 60 * 60);    	
				else
					self.object.rotation.y += self.app.currentSpeed / (24 * 60 * 60);    	
    	}
    });

    // planet orbit
    if (self.pivot) {
			self.animationFunctions.push(function() {
	    	
				if ( self.eccentricity > -1) {

			    var aRadius = self.semiMajorAxis / window.settings.distancePixelRatio;
			    var bRadius = aRadius * Math.sqrt(1.0 - Math.pow(self.eccentricity, 2.0));

			    // get the current angle
			    // the orbit period is always calculated in days, so here
			    // we need to change it to seconds
			    var angle = self.app.simTimeSecs / (self.siderealOrbitPeriod * 24 * 60 * 60) * Math.PI*2 * -1;

			    self.pivot.position.set(
			    	aRadius * Math.cos(angle) + (self.eccentricity * 100 * self.semiMajorAxis / 100) / window.settings.distancePixelRatio,
			    	0,
			    	bRadius * Math.sin(angle)
			    );
				}
				else
					self.pivot.rotation.y += 1 / self.siderealOrbitPeriod;
			});
    };
    
    // Inject functions array
    self.objectPlane.animate = function() {	
			self.animationFunctions.forEach(function(dt) {
				dt();
			});
    };

  }

});
});

;require.register("views/coordinate_system_view", function(exports, require, module) {
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
});

;require.register("views/firmament_view", function(exports, require, module) {
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

});

;require.register("views/galaxy_cluster_view", function(exports, require, module) {
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

});

;require.register("views/galaxy_skybox_view", function(exports, require, module) {
var View = require('./view');

var Particle = require('models/particle');
var Shaders = require('lib/shaders');

module.exports = View.extend({

	id: 'galaxy-skybox',
  template: false,

	initialize: function( options ) {
		console.log(' --- rendering galaxy skybox --- ');

		this.app = options.app;
		// load the cube textures
		var urlPrefix = "img/skybox/s_";
		this.urls = [ 
			urlPrefix + "px.jpg", 
			urlPrefix + "nx.jpg",
			urlPrefix + "py.jpg", 
			urlPrefix + "ny.jpg",
			urlPrefix + "pz.jpg", 
			urlPrefix + "nz.jpg" 
		];

		this.textureCube = THREE.ImageUtils.loadTextureCube( this.urls );
		
		// init the cube shader
		this.shader = THREE.ShaderLib["cube"];
		this.shader.uniforms["tCube"].value = this.textureCube;
		this.shader.uniforms["opacity"] = { 
			value: 0.1, 
			type: "f" 
		};

		this.skyboxUniforms = this.shader.uniforms;

		var material = new THREE.ShaderMaterial({
			fragmentShader: this.shader.fragmentShader,
			vertexShader: this.shader.vertexShader,
			uniforms: this.shader.uniforms,
			side: THREE.BackSide,
			opacity: 0.1,
			depthWrite: false,
			depthTest: false
		});

		// build the skybox Mesh
		var skyboxMesh = new THREE.Mesh( 
			new THREE.CubeGeometry( 
				10000 * window.settings.LY / window.settings.distancePixelRatio, 
				10000 * window.settings.LY / window.settings.distancePixelRatio,
				10000 * window.settings.LY / window.settings.distancePixelRatio,
				1,
				1, 
				1, 
				null, 
				true 
			), 
			material 
		);

		skyboxMesh.rotation.set(0, -180, 0);

		/*
		var sphere = new THREE.Mesh(
			new THREE.SphereGeometry(10000 * window.settings.LY / window.settings.distancePixelRatio, 64, 64), 
			new THREE.MeshBasicMaterial({
			  map: THREE.ImageUtils.loadTexture('img/galaxy-m.jpg'),
			  shading: THREE.SmoothShading, 
			  blending: THREE.AdditiveBlending, 
			  side: THREE.DoubleSide,
			  color: 0xffffff, 
			  ambient: 0xffffff, 
			  shininess: 100
			})
		);
		*/
      	
    // this.app.scene.add(sphere);
		this.app.scene.add( skyboxMesh );
		this.render();

		_.bindAll(this, 
			'render', 
			'update'
		);

		return this;		
	},

	render: function(){

	},

	update: function(){
		var skyboxBrightness = 1.4 / this.app.camera.position.z;

		// console.log(skyboxBrightness);
		this.skyboxUniforms['opacity'].value = 0.1;
	},

	show: function(){
	
	},

	hide: function() {
	
	}

});

});

;require.register("views/galaxy_view", function(exports, require, module) {
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

});

;require.register("views/infobox_view", function(exports, require, module) {
var View = require('./view');
var PopupView = require('./popup_view');

module.exports = View.extend({

	id: 'infobox',
  template: require('./templates/infobox'),

  events: {
  	'click .close-btn': 'close',
    'click #actions .action': 'doAction',
    'click #tab-list li': 'tab'
  },

  initialize: function( options ){
  	this.app = options.app;
    this.object = options.object;
    this.model = options.data;
    this.content = require('./templates/' + options.template);

  	_.bindAll(this, 
      'render', 
      'close',
      'doAction',
      'tab',
      'loadImages'
    );

    console.log(options);

    if (this.model.texture)
      this.model.image = this.model.texture;

    // read the planet infos for this stellar system
    var self = this;
    var satellites = null;
    _.each(this.app.planetsystems.models, function(system, index){
      if (system.get('name') === self.model.name) {
        satellites = system.get('satellites');
      }
    }); 

    this.model.satellites = satellites;
    this.render();
  },

  render: function(){
    var self = this;

    $('#' + self.id).remove();
    $('body').append(self.$el.html(self.template()));
    $('#infobox-content').html(this.content(self.model));

    this.loadImages($('#tab-images'));
  },

  close: function(e){
    e.preventDefault();
    $('#' + this.id).remove();
  },

  doAction: function(e){
    var self = this;
    e.preventDefault();

    var action = $(e.currentTarget).attr('action');

    if (action == 'show') {
      self.app.addSystem(this.model.id);
    }

    if (action == 'moveTo') {
      // animate the camera to the new location
      self.app.config.distance.value = 1;
      self.app.config.distance.type = 'au';
      self.app.cameraHelper.bindObject = self.model;
      self.app.cameraHelper.moveTo(self.app.camera.position, self.model.position, 5000, function(){
        self.app.cameraHelper.bindObject = null
      });

      // also load the system after the camera has been moved there
      self.app.addSystem(self.model.id);
    }

    if (action == 'bindTo') {
      self.app.animationControlsView.pause();
      self.app.cameraHelper.bindTo(self.object, self.model.position);
    }
  },

  tab: function(e){
    var $el = $(e.currentTarget);
    var container = $el.attr('rel');

    $('#tab-list li').removeClass('active');
    $el.addClass('active');

    $('#tabs .tab').removeClass('active');
    $('#tabs #' + container).addClass('active');
  },

  loadImages: function( el ){
    var name = this.model.name;
        name = 'planetary system ' + name;

    $.getJSON('http://ajax.googleapis.com/ajax/services/search/images?v=1.0&start=0&rsz=5&q='+ name +'&callback=?', function(data) {
      var images = data.responseData.results;

      var $ul = $('<ul/>');
          $ul.prepend('<p>Image data provided by Google Search</p>')

      for (i in images) {
        var url = images[i].url;
        var $li = $('<li/>');
            $li.append('<img src="'+ url +'" />');

        $ul.append( $li );
      }

      el.html( $ul );

    });
  },

  showLoading: function(){
    $('#loading').fadeIn();
  },

  hideLoading: function(){
    $('#loading').fadeOut();
  }

});
});

;require.register("views/label_view", function(exports, require, module) {
var View = require('./view');

var InfoboxView = require('views/infobox_view');

module.exports = View.extend({

	id: _.uniqueId(),
  tagName: 'span',
  className: 'space-label',
  template: null,

  events: {
    'click': 'labelClicked',
    'mouseenter': 'labelMouseEnter',
    'mouseleave': 'labelMouseLeave'
  },

  initialize: function( options ){
  	this.app = options.app;
    this.object = options.object,
  	this.data = options.data;
    this.planetsystem = options.planetsystem;

    this.currentOrbitColor = null;
    this.currentOrbitOpacity = null;

  	this.render();

  	_.bindAll(this, 'render', 'labelClicked', 'labelMouseEnter', 'labelMouseLeave');
  },

  render: function(){
  	var self = this;

  	// render the label as html object to prevent zooming with web gl
    var labelID = 'object-' + self.data.name.replace(' ', '-').toLowerCase();
        labelID = labelID.replace(' ', '-');

    self.$el.attr('id', labelID);
    self.$el.html(self.data.name);

    self.$el.addClass('labelgroup-' + self.app.systems.length);
    self.$el.addClass('planetsystem-' + this.planetsystem.name.replace(' ', '').toLowerCase() );
    self.$el.css({'color': '#' + window.settings.orbitColors[ self.app.systems.length ].toString(16) });

    return self;
  },

  labelClicked: function(){
    var self = this;
    self.infobox = new InfoboxView({
      app: self.app,
      object: self.object,
      data: self.data,
      template: 'planet-info'
    });
  },

  labelMouseEnter: function(e){
    var self = this;
    var name = $(e.currentTarget).attr('id').replace('object-', '');

    _.each( self.app.orbits, function( orbit, idx ) {
      if (orbit.name.toLowerCase() == name) {
        self.currentOrbitColor = orbit.line.material.color;
        self.currentOrbitOpacity = orbit.line.opacity;

        orbit.line.material.color = new THREE.Color( 0xffffff );
        orbit.line.opacity = 1.0;
      }
    });
  },

  labelMouseLeave: function(e) {
    var self = this;
    var name = $(e.currentTarget).attr('id').replace('object-', '');

    _.each( self.app.orbits, function( orbit, idx ) {
      if (orbit.name.toLowerCase() == name) {
        orbit.line.material.color = self.currentOrbitColor;
        orbit.line.opacity = self.currentOrbitOpacity;
      }
    });
  }

});
});

;require.register("views/loader_view", function(exports, require, module) {
var View = require('./view');

module.exports = View.extend({

	id: 'loader',
  template: require('./templates/loader'),

  initialize: function( options ){
  	this.options = options;

  	_.bindAll(this, 'render');
  }

});
});

;require.register("views/menu_view", function(exports, require, module) {
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
});

;require.register("views/particle_stars_view", function(exports, require, module) {
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
});

;require.register("views/planet_view", function(exports, require, module) {
var View = require('./view');

var Textures = require('lib/textures');
var Geometries = require('lib/geometries');

var LabelView = require('./label_view');

module.exports = View.extend({

	id: null,
  template: null,

  initialize: function( options ){
  	// console.log( options );

  	this.app = options.app;
  	this.data = options.data;
  	this.planetsystem = options.planetsystem;
  	this.parentGroup = options.group;

  	if (options.visible === undefined)
  		this.visible = 1;

  	this.animationFunctions = [];
  	this.texture = options.data.texture || false;

  	// orbit options
		this.eccentricity = options.data.eccentricity || 0.0;
		this.semiMajorAxis = options.data.semiMajorAxis || 1;
		//this.semiMinorAxis = this.semiMajorAxis * Math.sqrt( 1 - Math.pow(this.eccentricity, 2) );
		this.inclination = options.data.inclination || 0;

		this.rotationPeriod = options.data.rotationPeriod || null;
		this.rotationClockwise = options.data.rotationClockwise;
		this.longitudeAscendingNode = options.data.longitudeAscendingNode || 0;

		// assumed one erath year if not given
		this.siderealOrbitPeriod = options.data.siderealOrbitPeriod || 365;

  	this.radius = options.data.radius || window.settings.radiusEarth;
  	// console.log(this.radius);
  	if( this.data.type == 'planet' && this.radius < 1000 ) {
			this.radius *= window.settings.radiusEarth;
		}

		if (this.data.orbit_color !== undefined) 
			this.data.orbitColor = this.data.orbit_color;

		if (this.data.confirmed == undefined)
			this.data.confirmed = 1;

  	// used for longitude of the ascending node
		this.referencePlane = new THREE.Object3D();

		// base plane holds the orbit ellipse and inclination
		this.basePlane = new THREE.Object3D();

		// pivot holds the planet sphere shape
	  this.pivot = new THREE.Object3D();

	  // planet plane is used for additional objects like moons
	  // moons will be added as child objects to this group
		this.objectPlane = new THREE.Object3D();

  	this.referencePlane.add( this.basePlane );
		this.basePlane.add(this.pivot);
		this.pivot.add(this.objectPlane);
		this.parentGroup.add( this.referencePlane );

		this.color = new THREE.Color( window.settings.planets.defaultColor );

		if (options.data.color)
			this.color.setRGB( options.data.color[0], options.data.color[1], options.data.color[2] );

  	this.render();
		this.renderOrbit();
		this.prepareAnimations();

		if (!this.visible) {
			this.hideChildren();
		}

		this.labelView = null;
		
		_.bindAll(this, 'render');

  	return this;
  },

  render: function() {
  	var self = this;

  	var geometry = new THREE.SphereGeometry( this.radius / window.settings.radiusPixelRatio, 32, 32 );
		var material = new THREE.MeshLambertMaterial({ 
			color: self.color.getHex()
		});

		var planetTransparency = 1.0;
		if (!self.data.confirmed) {
			planetTransparency = 0.25;
		}
	  if( self.texture ){
	  	material = new THREE.MeshLambertMaterial({
		    map: THREE.ImageUtils.loadTexture('img/materials/'+ self.texture + ''),
		    wireframe: false,
		    transparent: true,
		    opacity: planetTransparency
		  });
	  };

	  this.object = new THREE.Mesh(geometry, material);
		this.object.name = self.data.name;
		this.object.properties = {
			name: self.data.name,
			realName: self.realName,
			radius: self.radius.toFixed(2),
			distance: (self.data.distance * window.settings.PC).toFixed(4),
			siderealOrbitPeriod: self.siderealOrbitPeriod,
			semiMajorAxis: self.semiMajorAxis,
			eccentricity: self.eccentricity,
			inclination: self.inclination,
			rotationPeriod: self.rotationPeriod,
			image: self.texture,
			temparature: self.data.temp,
			masse: self.data.masse,
			habitable: self.data.habitable,
			esi: self.data.esi,
			habitableMoon: self.data.habitableMoon,
			method: self.data.method,
			year: self.data.year,
			type: self.data.class,
			tempClass: self.data.tempClass,
			confirmed: self.data.confirmed,
			texture: self.texture
		};

		this.object.spaceRadius = self.radius / window.settings.radiusPixelRatio;
		this.objectPlane.add(this.object);
		this.planetsystem.meshes.push(this.object);
		this.app.meshes.push(this.object);

		if ( self.data.type == 'planet' || self.data.type == 'moon' || self.data.type == 'dwarf-planet' || self.data.type == 'star' || self.data.type == 'comet' ) {
			this.labelView = new LabelView({ 
				app: self.app, 
				object: self,
				data: self.object.properties, 
				planetsystem: self.planetsystem 
			});
			$('#labels').append(this.labelView.render().el);
		}
  },

  showChildren: function(){
		this.basePlane.traverse(function(object){ 
			object.visible = true; 
		});

		// this.labelView.show();
  },

  hideChildren: function(){
		this.basePlane.traverse(function(object){ 
			object.visible = false; 
		});
		// this.labelView.hide();
  },

  renderOrbit: function() {
  	var self = this;
	  var circle = new THREE.Shape();
	  //circle.moveTo(this.position[0], 0);

	  if( this.eccentricity >= -1 ) {

	  	// aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise
			var ellipseCurve = new THREE.EllipseCurve(
				(self.eccentricity * 100 * self.semiMajorAxis / 100) / window.settings.distancePixelRatio,
				0,
	   		self.semiMajorAxis / window.settings.distancePixelRatio, 

	   		// taken from http://en.wikipedia.org/wiki/Semi-minor_axis
				( self.semiMajorAxis * Math.sqrt(1 - Math.pow(self.eccentricity, 2) ) ) / window.settings.distancePixelRatio, 
	    	0, 
	    	2.0 * Math.PI,
	    	false
	    );

			var ellipseCurvePath = new THREE.CurvePath();
					ellipseCurvePath.add(ellipseCurve);

			var ellipseGeometry = ellipseCurvePath.createPointsGeometry(200);
					ellipseGeometry.computeTangents();

			// render solid line		
			/*
			var orbitMaterial = new THREE.LineBasicMaterial({
			  color: window.settings.orbitColors[ App.systems.length ],
			  blending: THREE.AdditiveBlending,
			  depthTest: true,
			  depthWrite: false,
			  opacity: window.settings.orbitTransparency,
				linewidth: window.settings.orbitStrokeWidth,
			  transparent: true
			});
			*/

			var orbitTransparency = window.settings.orbitTransparency;
			if (!self.data.confirmed) {
				orbitTransparency = 0.25;
			}

			var orbitColor = window.settings.orbitColors[ this.app.systems.length ];
			
			if (self.data.type == 'comet' || self.data.type == 'dwarf-planet') {
				orbitColor = 0x909090;
				orbitTransparency = 0.25;
			}

			if (this.data.orbitColor) {
				orbitColor = this.data.orbitColor;
			}

			// render dashed line
			var orbitMaterial = new THREE.LineDashedMaterial({
			  color: orbitColor,
			  blending: THREE.AdditiveBlending,
			  depthTest: true,
			  depthWrite: false,
			  opacity: orbitTransparency,
				linewidth: window.settings.orbitStrokeWidth,
			  transparent: true,
			  dashSize: window.settings.AU/10, 
			  gapSize: window.settings.AU/10 
			});

			var line = new THREE.Line(ellipseGeometry, orbitMaterial);
			
			if (!self.data.confirmed || self.data.type === 'comet' || self.data.type == 'dwarf-planet') {
				ellipseGeometry.computeLineDistances();
				line = new THREE.Line(ellipseGeometry, orbitMaterial, THREE.LinePieces);
			}

			line.orbitColor = window.settings.orbitColors[ this.app.systems.length ];
			// line.orbitColorHover = window.settings.Colors[ App.systems.length ].orbitHover;

			this.referencePlane.rotation.y = this.longitudeAscendingNode * Math.PI/2;
			line.rotation.set(Math.PI/2, 0, 0);

			if( this.type != 'camera' ) {
		  	self.basePlane.add(line);
		  	self.planetsystem.orbits.push({ 
		  		line: line ,
		  		name: self.data.name.replace(' ', '-').toLowerCase(), 
		  		type: self.data.type
		  	});

		  	self.app.orbits.push({ 
		  		line: line ,
		  		name: self.data.name.replace(' ', '-').toLowerCase(), 
		  		type: self.data.type
		  	});
	  	}

		} else {

			// x, y, radius, start, end, anti-clockwise
			circle.absarc(0, 0, self.semiMajorAxis / window.settings.distancePixelRatio, 0, Math.PI*2, false);

			var points = circle.createPointsGeometry(128);
		  v_circle = new THREE.Line(
		  	points, 
				new THREE.LineBasicMaterial({ 
					//color: self.orbitColor,
					color: window.settings.orbitColors[ self.app.systems.length ],
					opacity: window.settings.orbitTransparency,
					linewidth: window.settings.orbitStrokeWidth,
					transparent: true
				})
			);

		  v_circle.rotation.set(Math.PI/2, 0, 0);

		  self.basePlane.add(v_circle);
		  self.planetsystem.orbits.push({ 
		  	line: v_circle,
		  	name: self.data.name, 
		  	type: self.data.type
		  });

		  self.app.orbits.push({ 
	  		line: v_circle,
	  		name: self.data.name, 
	  		type: self.data.type
	  	});

		}

		this.basePlane.inclination = 1;
		this.basePlane.rendertype = 'basePlane';
		this.basePlane.rendername = this.name;

		// set the inclination
		if ( this.inclination > 0 && self.app.config.settings.inclination ) {
			this.basePlane.inclination = this.inclination;
			this.basePlane.rotation.set(this.inclination * Math.PI / 180.0, 0, 0);
		}

  },

  prepareAnimations: function(){
  	var self = this;

    // rotation of the space object
    // not all objects have self rotation, e.g. mercury and moon don't have
    // venus has a negative rotation

    self.animationFunctions.push(function() {

    	// we have rotationPeriod in earth days
    	if ( self.rotationPeriod ) {

    		if ( self.rotationClockwise === false )
					self.object.rotation.y -= self.app.currentSpeed / (24 * 60 * 60);    	
				else
					self.object.rotation.y += self.app.currentSpeed / (24 * 60 * 60);    	
    	}
    });

    // planet orbit
    if (self.pivot) {
			self.animationFunctions.push(function() {
	    	
				if ( self.eccentricity > -1) {

			    var aRadius = self.semiMajorAxis / window.settings.distancePixelRatio;
			    var bRadius = aRadius * Math.sqrt(1.0 - Math.pow(self.eccentricity, 2.0));

			    // get the current angle
			    // the orbit period is always calculated in days, so here
			    // we need to change it to seconds
			    var angle = self.app.simTimeSecs / (self.siderealOrbitPeriod * 24 * 60 * 60 * 10) * Math.PI*2 * -1;

			    var x = aRadius * Math.cos(angle) + (self.eccentricity * 100 * self.semiMajorAxis / 100) / window.settings.distancePixelRatio;
			    var y = 0;
			    var z = bRadius * Math.sin(angle);

			    self.pivot.position.set(x, y, z);
			    self.app.scene.updateMatrixWorld();

			    var vector = new THREE.Vector3();
							vector.getPositionFromMatrix( self.pivot.matrixWorld );
					self.object.properties.position = {x: vector.x, y: vector.y, z: vector.z};
				}
				else
					self.pivot.rotation.y += 1 / self.siderealOrbitPeriod;
			});
    };
    
    // Inject functions array
    self.objectPlane.animate = function() {	
			self.animationFunctions.forEach(function(dt) {
				dt();
			});
    };

  }

});
});

;require.register("views/planetsystem_view", function(exports, require, module) {
var View = require('./view');

var Textures = require('lib/textures');
var Geometries = require('lib/geometries');

var SpaceObjectView = require('views/spaceobject_view');
var StarView = require('views/star_view');
var PlanetView = require('views/planet_view');
var AsteroidBeltView = require('views/asteroidbelt_view');

module.exports = View.extend({
  id: null,
  template: null,

  initialize: function( options ){

  	console.log('initializing planet system');

  	this.app = options.app;
    this.model = options.model;

    this.geometries = new Geometries();
    this.textures = new Textures();

    this.id = this.model.id || null;
		this.name = this.model.name;
		this.radius = this.model.radius || 1000;

		this.orbitColor = window.settings.orbitColors[ this.app.systems.length ];

		this.temp = this.model.temp || null;
		this.luminosity = this.model.luminosity || null;

		// a solar system may consist of multiple stars
		this.stars = this.model.stars || [];
		this.satellites = this.model.satellites || [];
		this.meshes = [];
		this.orbits = [];

		// create the group of the star(s)
		this.group = new THREE.Object3D();

		// set initial visibility to true
		this.isVisible = true;

		//this.group.position.set(0, window.exoplanetsystems.systems.length * 1000, 0);
	  // this.showSystemPlane = data.showSystemPlane || true;
		// this.renderHabitableZone();
		this.renderObjects();

		this.renderTemparatureZones();

		// place the group at the position where the camera currently looks at
		// var vector = new THREE.Vector3(0, 0, -1);
    // vector.applyEuler(this.app.camera.rotation, this.app.camera.eulerOrder);

    // this.group.position.set(vector);
		this.app.scene.add(this.group);

		_.bindAll(this, 'render', 'renderTemparatureZones');
  },

  renderObjects: function() {
		var self = this;

		// render the star
		self.model.stars[0].parentGroup = self.group;
		self.model.stars[0].meshes = self.meshes;
		self.model.stars[0].satellites = self.satellites;
		self.model.stars[0].orbits = self.orbits;
		self.model.stars[0].systemName = self.name;

		self.model.stars[0].orbitColor = self.orbitColor;

		var starView = new StarView({ 
			app: self.app,
			data: self.model.stars[0] 
		});


		// can be planets, moon or other objects (asteroids, spaceships)
		for ( satellite in self.satellites ) {
			var object = self.satellites[satellite];
			if ( object.type === 'planet' || object.type === 'dwarf-planet' || object.type === 'moon' || object.type === 'comet' ) {
				var planetView = new PlanetView({ 
					app: self.app, 
					planetsystem: self,
					data: object, 
					group: self.group 
				});

				for ( moon in object.satellites ) {
					var obj = object.satellites[moon];
					new PlanetView({ 
						app: self.app, 
						planetsystem: self,
						data: obj, 
						group: planetView.objectPlane,
						visible: 0
					});
				}
			}

			/*
			if (object.type === 'asteroid-belt') {
				new AsteroidBeltView({ 
					app: self.app, 
					planetsystem: self,
					data: object, 
					group: self.group 
				});
			}
			*/
		}

	},

	renderTemparatureZones: function(){

		/**
		 * 24 Sex:
		 * minHZ: 2.941, maxHZ: 7.147
		 *  
	   * 8.00 = 100%
		 * 7.15 = 89.37% 
		 * 2.94 = 36.75% 
		 * --------------------------
		 *
		 * Solar System:
		 * minHZ: 0.95, maxHZ: 1.67 
		 *  
	 	 * 2.00 = 100%
	 	 * 1.67 = 83.5% 
		 * 0.95 = 47.5%
		 * --------------------------
		 *
		 * 2m 0103(ab):
		 * minHZ: 0.134, maxHZ: 0.348
		 *  
	 	 * 1.00 = 100%
	 	 * 0.348 = 34.80% 
		 * 0.134 = 13.40%
		 * 
		 */


		var minHZ = this.stars[0].minhz;
		var maxHZ = this.stars[0].maxhz;

		var HZPercentDimension = window.utils.getDimensionToTen( minHZ, maxHZ );

		console.log( HZPercentDimension );

		if( minHZ && maxHZ ) {

			console.log('render hab zone: ', minHZ, maxHZ);

			var normalizedMinHZ = minHZ * window.settings.AU / window.settings.distancePixelRatio;
			var normalizedMaxHZ = maxHZ * window.settings.AU / window.settings.distancePixelRatio;

			var centerHZ = normalizedMaxHZ - normalizedMinHZ;

			// create 2d zone temparature texture
			var canvas = document.createElement('canvas');
	        canvas.width = 256;
	        canvas.height = 256;

	    var context = canvas.getContext('2d');
	        centerX = canvas.width / 2;
	        centerY = canvas.height / 2;
			
	    var objGradient = context.createRadialGradient( centerX, centerY, 1, centerX, centerY, canvas.width/2 );


	    var colorStopMin = HZPercentDimension.minPercent - 0.1;
	    var colorStopMax = HZPercentDimension.maxPercent + 0.1;

	    if( colorStopMin <= 0.0) colorStopMin = 0.1;
	    if( colorStopMax >= 1.0) colorStopMax = 0.95;

	    objGradient.addColorStop( 0, 'rgba(255, 25, 25, 1.0)');
	    objGradient.addColorStop( colorStopMin, 'rgba(255, 125, 25, 0.5)');
	    objGradient.addColorStop( HZPercentDimension.minPercent + 0.1, 'rgba(50, 255, 50, 0.5)');
	    objGradient.addColorStop( HZPercentDimension.maxPercent - 0.1, 'rgba(50, 255, 50, 0.5)');
	    objGradient.addColorStop( colorStopMax, 'rgba(0, 0, 200, 0.5)');
	    objGradient.addColorStop( 1.0, 'rgba(0, 0, 200, 0.01)');

	    context.fillStyle = objGradient;

	    context.beginPath();
	    context.arc( centerX, centerY, canvas.width/2, 0, 2*Math.PI, true );
	    context.fill();
	    
			var texture = new THREE.Texture(canvas); 
					texture.needsUpdate = true;
		      
	  	var material = new THREE.MeshBasicMaterial({
	  		map: texture,
	  		transparent: true,
	  		opacity: 0.4,
	  		side: THREE.DoubleSide 
	  	});

	  	//var dimension = (centerHZ*2) + ( (centerHZ*2) * 75 / 100 )*2;
	  	var dimension = (window.settings.AU / window.settings.distancePixelRatio )*2 * HZPercentDimension.size

	    var mesh = new THREE.Mesh(
	    	new THREE.PlaneGeometry( dimension, dimension ),
	   		material
	   	);

			//mesh.position.set( 0, - window.exoplanetsystems.systems.length * 10, 0 );
			mesh.position.set( 0, this.app.systems.length * 5, 0 );
			mesh.rotation.set( -90 * Math.PI / 180, 0, 0 );

			// render the specific limits as well		
			var innerHZLine = this.geometries.renderDashedCircle( normalizedMinHZ, new THREE.Color('rgba(255, 50, 255, 0.75)') );
			var outerHZLine = this.geometries.renderDashedCircle( normalizedMaxHZ, new THREE.Color('rgba(255, 50, 255, 0.75)') );

			//this.group.add( innerHZLine );
			//this.group.add( outerHZLine );

			mesh.visible = this.app.config.settings.habitable_zone;

			this.group.add( mesh );
			this.habitableZone = mesh;
			this.app.habitableZones.push( mesh );

		}
	},


	renderHabitableZone: function() {
		var self = this;

		//console.log( 'Star data', self );

		// radius in sun radii
		var r = self.stars[0].radius * window.settings.radiusSun;
		var t = self.stars[0].temp;
		var L = self.stars[0].lum;

		// we need to check if the star has an effective temparature given
		if( !t ) {
			//var sLR = Math.pow(2, L);
			var sLR = (1 + L) + 1;
		}

		else {
			var sLR = Math.pow( (r / window.settings.radiusSun), 2) * Math.pow( (t / window.settings.tempSun), 4);
		}

		//console.log('Lum relation', sLR );

		// render inner boundary nad outer boundary of habitable zone
		// the habitable zone should be rendered in green

		// the hz is beeing calculated in relation to the hz of our sun.
		// star boundary = Sun boundary × Sqrt[ (star luminosity)/(Sun luminosity) ].
		// so we nee to calculate the star's luminosity first.
		// L = 4 PI r^2 BoltzmanConst T^4

		var starLuminosity = 4*Math.PI * Math.pow(self.radius, 2) * window.settings.Boltzmann * Math.pow(self.temp, 4);
	 	var starLuminosityRelation = Math.sqrt(starLuminosity / window.settings.sunLiminosity);

		// var minHZ = sLR * window.settings.minHZ;
		// var maxHZ = sLR * window.settings.maxHZ;

		var minHZ = self.stars[0].minhz;
		var maxHZ = self.stars[0].maxhz;

		// console.log('minHz', minHZ);
		// console.log('maxHz', maxHZ);

		if( minHZ && maxHZ ) {

			var normalizedMinHZ = minHZ * window.settings.AU / window.settings.distancePixelRatio;
			var normalizedMaxHZ = maxHZ * window.settings.AU / window.settings.distancePixelRatio;

			var arcShape = new THREE.Shape();
			arcShape.moveTo( normalizedMaxHZ, 0 );
			arcShape.absarc( 0, 0, normalizedMaxHZ, 0, Math.PI*2, false );

			var holePath = new THREE.Path();
			holePath.moveTo( normalizedMinHZ, 0 );
			holePath.absarc( 0, 0, normalizedMinHZ, 0, Math.PI*2, true );
			arcShape.holes.push( holePath );

			var geometry = new THREE.ShapeGeometry( arcShape );

			/*
				var geometry = new THREE.Line( 
					arcShape.createPointsGeometry(100),
					new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.5 }) 
				);
			*/

			// self.group.add( geometry );

			var mesh = new THREE.Mesh(
				geometry, 
				new THREE.MeshBasicMaterial({ 
					color: window.settings.habitableZoneColor,
					transparent: true,
					opacity: 0.75,
					side: THREE.DoubleSide
				})
			);

			mesh.position.set( 0, this.app.systems.length, 0);
			mesh.rotation.set( -90 * Math.PI / 180, 0, 0 );
			//mesh.scale.set(1, 1, 1);

			mesh.visible = window.settings.filters.habitableZones;

			self.group.add( mesh );
			// self.habitableZone = mesh;
			self.app.habitableZones.push( mesh );

			/*
			var smooth = geometry.clone();
	    smooth.mergeVertices(); 
			var modifier = new THREE.SubdivisionModifier( 2 );
	   	modifier.modify( geometry );
	    //modifier.modify( smooth );
	    */
	  }
	},

  render: function(){
    var self = this;
  	return self;
  }

});
});

;require.register("views/popup_view", function(exports, require, module) {
var View = require('./view');
var SearchList = require('./search_list');

module.exports = View.extend({

	id: 'popup',
  template: require('./templates/popup'),

  events: {
  	'click .close-btn': 'close',
    'mouseover #popup': 'hovered',
    'change input[type=checkbox]': 'checkboxClicked',
    'keyup input[name=field-search]': 'search'
  },

  initialize: function( options ){
  	this.app = options.app;
    this.content = require('./templates/' + options.template);

    this.model = options.data || {};

  	_.bindAll(this, 
      'render', 
      'close', 
      'hovered', 
      'checkboxClicked', 
      'search',
      'toggleVisibility'
    );

    this.render();
  },

  render: function(){
    var self = this;
    var data = {data: self.model};

    $('#' + self.id).remove();
    $('body').append(this.$el.html(this.template(data)));
    $('#popup-content').html(this.content(data));

    this.$el.css({
      'margin-left': - $(self.$el).outerWidth() / 2,
      'margin-top': - $(self.$el).outerHeight() / 2
    });
  },

  close: function(e){
    e.preventDefault();
  	
    $('#' + this.id).remove();
  },

  hovered: function(e){
    e.preventDefault();
    e.stopPropagation();
  },

  checkboxClicked: function(e){
    var type = $(e.currentTarget).attr('type');
    var id = $(e.currentTarget).attr('id');

    switch(id) {
      case 'checkbox-labels':
        $('#labels').toggleClass('hidden');
        $('#star-labels').toggleClass('hidden');
      break;
      case 'checkbox-orbits':
        window.settings.showOrbits = !window.settings.showOrbits;
      break;
      case 'checkbox-orbit-inclination':
        window.settings.showInclination = !window.settings.showInclination;
      break;
      case 'checkbox-distance-rings':
        window.settings.showDistances = !window.settings.showDistances;
      break;
    }
  },

  toggleVisibility: function(object){

  },

  search: function(e){
    var self = this;
    var $el = $(e.currentTarget);
    var key = $el.val().toLowerCase();

    if ( key.length >= 3 ) {

      // 1. search by planet name (ex: Kepler-90 b)
      // 2. search by star name (ex: Kepler-90 b)
      // 3. search planets by constellation name (ex: And or Andromeda)

      var data = [];
      _.each(self.app.planetsystems.models, function(planetsystem){
        var n = planetsystem.get('name').toLowerCase();
        if (n == key || n.indexOf(key) > -1)
          data.push(planetsystem.attributes);
      });

      _.each(self.app.constellations.models, function(constellation){
        var n = constellation.get('name').toLowerCase();
        if (n == key || n.indexOf(key) > -1)
          data.push(constellation.attributes);
      });

      var searchList = new SearchList({app: self.app, model: {data: data}});
      $el.parent().find('.dynamic').html( searchList.render().el );
    }
  },

  showLoading: function(){
    $('#loading').fadeIn();
  },

  hideLoading: function(){
    $('#loading').fadeOut();
  }

});
});

;require.register("views/search_list", function(exports, require, module) {
var View = require('./view');

module.exports = View.extend({

	id: 'search-list',
	tagName: 'ul',
  template: require('./templates/search-list'),

  events: {
    'click li': 'itemClicked'
  },

  initialize: function( options ){
  	this.app = options.app;
    this.model = options.model;

  	_.bindAll(this, 'render', 'itemClicked');
  },

  render: function(){
  	console.log(this.model);
  	this.$el.html(this.template(this.model));
  	return this;
  },

  itemClicked: function(e){
    var id = $(e.currentTarget).attr('rel').replace('system-', '');
    this.app.addSystem(id);
  }

});
});

;require.register("views/spaceobject_view", function(exports, require, module) {
var View = require('./view');

// var SpaceObjectView = require('./spaceobject_view');

module.exports = View.extend({
  id: null,
  template: null,

  initialize: function( options ){

  	this.app = options.app;
		this.data = options.data;
		this.id = options.data.id || Math.random() * 10000;
		this.realName = options.data.name;
		this.systemName = options.data.systemName;
		this.name = options.data.name.replace(/\s/g, '-');
		this.type = options.data.type;
		this.spectralClass = options.data.spec || null;

		this.radius = options.data.radius || window.settings.radiusEarth;

		// if we have planet the values is lower than 1000 km we assume that the size is given
		// as earth value
		if( this.type == 'planet' && this.radius < 1000 ) {
			this.radius *= window.settings.radiusEarth;
		}

		this.rotation = options.data.rotation || 0;
		this.distance = options.data.distance || null;

		// orbit options
		this.eccentricity = options.data.eccentricity || 0;
		this.semiMajorAxis = options.data.semiMajorAxis || 1;
		//this.semiMinorAxis = this.semiMajorAxis * Math.sqrt( 1 - Math.pow(this.eccentricity, 2) );
		this.inclination = options.data.inclination || 0;

		this.rotationPeriod = options.data.rotationPeriod || null;
		this.rotationClockwise = options.data.rotationClockwise;
		this.longitudeAscendingNode = options.data.longitudeAscendingNode || 0;

		// assumed one erath year if not given
		this.siderealOrbitPeriod = options.data.siderealOrbitPeriod || 365;
		
		// additional values might be used later
		this.periapsis = this.semiMajorAxis * (1 - this.eccentricity) / window.settings.AU;
		this.apoapsis = this.semiMajorAxis * (1 + this.eccentricity) / window.settings.AU;

		// console.log('render object name', this.name);

	  this.animationFunctions = [];

	  
	  // object paramters
	  this.orbitColor = options.data.orbitColor || window.settings.orbitColor;
		this.isSatellite = options.data.isSatellite || false;

		this.parentGroup = options.data.parentGroup || this.app.scene;
		this.mesh;
		this.material;

		this.color = new THREE.Color( window.settings.planets.defaultColor );

		if(options.data.color)
			this.color.setRGB( options.data.color[0], options.data.color[1], options.data.color[2] );

		// check if there was a texture given and render it
		this.texture = options.data.texture || false;

		// scene meshes array used for event dispatching
		this.meshes = options.data.meshes;

		// child objects like moons / asteroids or similar
		this.satellites = options.data.satellites;

		// scene orbits array
		this.orbits = options.data.orbits;


		// ----
		// Define 3D objects for the scene
		// ----

		// used for longitude of the ascending node
		this.referencePlane = new THREE.Object3D();

		// base plane holds the orbit ellipse and inclination
		this.basePlane = new THREE.Object3D();

		// pivot holds the planet sphere shape
	  this.pivot = new THREE.Object3D();

	  // planet plane is used for additional objects like moons
	  // moons will be added as child objects to this group
		this.objectPlane = new THREE.Object3D();

		// sattelites are all objects below a star
		if ( this.isSatellite ) {

			this.referencePlane.add( this.basePlane );
			this.basePlane.add(this.pivot);
			this.pivot.add(this.objectPlane);
			this.parentGroup.add( this.referencePlane );

		} else {
			this.parentGroup.add( this.objectPlane );
		}

		this.renderObject();
		this.renderOrbit();
		this.prepareAnimations();

		return this.object;
	},

	renderObject: function(){
		var self = this;
		var geometry;

		if( this.type == 'star' ) {

			/* 
			 * Stars are rendered as glowing light source
			 */

			// render as lens flare
			this.textureLensFlare = THREE.ImageUtils.loadTexture( "img/lensflare0.png" );

		  var light = new THREE.PointLight( 0xffffff, 1.5, 4500 );
					light.color.setHSL( 0.55, 0.9, 0.5 );
					light.position.set( 0, 0, 0 );
					
			// App.bulgeLight = light;
			light.intensity = 0.01;
			this.app.scene.add( light );

			var flareColor = new THREE.Color( 0xffffff );
					flareColor.setHSL( 0.55, 0.9, 0.5 + 0.7 );

			var lensFlare = new THREE.LensFlare( this.textureLensFlare, 128, 0.0, THREE.AdditiveBlending, flareColor );

			lensFlare.add( this.textureLensFlare, 32, 0.0, THREE.AdditiveBlending );
			lensFlare.add( this.textureLensFlare, 64, 0.75, THREE.AdditiveBlending );

			// lensFlare.add( this.textureLensFlare, 60, 0.6, THREE.AdditiveBlending );
			// lensFlare.add( this.textureLensFlare, 70, 0.7, THREE.AdditiveBlending );
			// lensFlare.add( this.textureLensFlare, 120, 0.9, THREE.AdditiveBlending );
			// lensFlare.add( this.textureLensFlare, 70, 1.0, THREE.AdditiveBlending );

			lensFlare.customUpdateCallback = function(){ return false; };
			lensFlare.position = light.position;

			// App.bulge = lensFlare;
			this.app.scene.add( lensFlare );
			this.rotationPeriod = window.settings.defaultStarRotationPeriod;

			// render star as geometry
			geometry = new THREE.SphereGeometry( 0.0001, 0, 0 );
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

			this.object.name = self.name;
			this.object.properties = {
				type: 'star',
				radius: self.radius,
				mass: self.data.mass,
				temp: self.data.temp,
				distance:  ( self.data.dist * window.settings.PC ).toFixed(2),
				minhz: self.data.minhz / 1000,
				maxhz: self.data.maxhz / 1000,
				planets: self.data.planets,
				texture: 'sun.jpg',
				spectralClass: self.spectralClass.toLowerCase()
			}

			this.meshes.push( this.object );			
		} 

		else {

			if( this.type == 'camera' ) {
				r = 0.01;
			}

			var geometry = new THREE.SphereGeometry( this.radius / window.settings.radiusPixelRatio, 32, 32 );
			var material = new THREE.MeshLambertMaterial({ 
				color: self.color.getHex()
			});

		  if( self.texture ){
		  	material = new THREE.MeshLambertMaterial({
			    map: THREE.ImageUtils.loadTexture('img/materials/'+ self.texture + ''),
			    wireframe: false  
			  });
		  };

		  this.object = new THREE.Mesh(geometry, material);
			this.object.name = self.name;
			this.object.properties = {
				name: self.name,
				realName: self.realName,
				radius: self.radius.toFixed(2),
				distance: (self.distance * window.settings.PC).toFixed(4),
				siderealOrbitPeriod: self.siderealOrbitPeriod,
				semiMajorAxis: self.semiMajorAxis,
				eccentricity: self.eccentricity,
				inclination: self.inclination,
				rotationPeriod: self.rotationPeriod,
				image: self.texture,
				temparature: self.data.temp,
				masse: self.data.masse,
				habitable: self.data.habitable,
				esi: self.data.esi,
				habitableMoon: self.data.habitableMoon,
				method: self.data.method,
				year: self.data.year,
				type: self.data.class,
				tempClass: self.data.tempClass,
				confirmed: self.data.confirmed
			};

			this.object.spaceRadius = self.radius / window.settings.radiusPixelRatio;
			this.objectPlane.add(this.object);

			if( this.type != 'camera' ) {
				this.meshes.push( this.object );
			}
		}

		if( self.type == 'planet' || self.type == 'dwarf-planet' || self.type == 'star' ) {
			
			/*
			// render the label as html object to prevent zooming with web gl
			var $label = $('<span class="space-label" id="object-'+ self.name +'">'+ self.realName +'</span>');
			$label.addClass('labelgroup-' + this.app.systems.length);
			$label.css({'color': '#' + window.settings.orbitColors[ this.app.systems.length ].toString(16) });

			$label.attr('rel', self.systemName);

			if( self.type == 'moon' )
				$label.addClass('moon');

			if( self.type == 'star' )
				$label.addClass('star');

			$('#labels').append( $label );	
			*/
		}

		if( self.satellites ) {
			_.each(self.satellites, function( satellite, index ){

				satellite.parentGroup = self.objectPlane;
				satellite.meshes = self.meshes;
				satellite.orbits = self.orbits;
				satellite.isSatellite = true;
				satellite.orbitColor = self.orbitColor;
				satellite.systemName = self.systemName;

				new SpaceObjectView({
					app: self.app,
					data: satellite
				});

			});	
		}
		
	},

	renderOrbit: function() {
	  var self = this;

	  var circle = new THREE.Shape();
	  //circle.moveTo(this.position[0], 0);

	  if( this.eccentricity >= -1 ) {

	  	// aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise
			var ellipseCurve = new THREE.EllipseCurve(
				(self.eccentricity * 100 * self.semiMajorAxis / 100) / window.settings.distancePixelRatio,
				0,
	   		self.semiMajorAxis / window.settings.distancePixelRatio, 

	   		// taken from http://en.wikipedia.org/wiki/Semi-minor_axis
				( self.semiMajorAxis * Math.sqrt(1 - Math.pow(self.eccentricity, 2) ) ) / window.settings.distancePixelRatio, 
	    	0, 
	    	2.0 * Math.PI,
	    	false
	    );

			var ellipseCurvePath = new THREE.CurvePath();
					ellipseCurvePath.add(ellipseCurve);

			var ellipseGeometry = ellipseCurvePath.createPointsGeometry(200);
					ellipseGeometry.computeTangents();

			// render solid line		
			/*
			var orbitMaterial = new THREE.LineBasicMaterial({
			  color: window.settings.orbitColors[ App.systems.length ],
			  blending: THREE.AdditiveBlending,
			  depthTest: true,
			  depthWrite: false,
			  opacity: window.settings.orbitTransparency,
				linewidth: window.settings.orbitStrokeWidth,
			  transparent: true
			});
			*/

			// render dashed line
			var orbitMaterial = new THREE.LineDashedMaterial({
			  color: window.settings.orbitColors[ this.app.systems.length ],
			  blending: THREE.AdditiveBlending,
			  depthTest: true,
			  depthWrite: false,
			  opacity: window.settings.orbitTransparency,
				linewidth: window.settings.orbitStrokeWidth,
			  transparent: true,
			  dashSize: window.settings.AU / 1000, 
			  gapSize: window.settings.AU / 1000
			});

			var line = new THREE.Line(ellipseGeometry, orbitMaterial);
			line.orbitColor = window.settings.orbitColors[ this.app.systems.length ];
			// line.orbitColorHover = window.settings.Colors[ App.systems.length ].orbitHover;

			this.referencePlane.rotation.y = this.longitudeAscendingNode * Math.PI/2;
			line.rotation.set(Math.PI/2, 0, 0);

			if( this.type != 'camera' ) {
		  	this.basePlane.add(line);
		  	this.orbits.push({ 
		  		line: line ,
		  		name: self.name, 
		  		type: self.type
		  	});
	  	}

		} else {

			// x, y, radius, start, end, anti-clockwise
			circle.absarc(0, 0, self.semiMajorAxis / window.settings.distancePixelRatio, 0, Math.PI*2, false);

			var points = circle.createPointsGeometry(128);
		  v_circle = new THREE.Line(
		  	points, 
				new THREE.LineBasicMaterial({ 
					//color: self.orbitColor,
					color: window.settings.Colors[ App.systems.length ].orbit,
					opacity: window.settings.orbitTransparency,
					linewidth: window.settings.orbitStrokeWidth,
					transparent: true
				})
			);

		  v_circle.rotation.set(Math.PI/2, 0, 0);
		  this.basePlane.add(v_circle);

		  this.orbits.push({ 
		  	line: v_circle,
		  	name: self.name, 
		  	type: self.type
		  });
		}

		this.basePlane.inclination = 1;
		this.basePlane.rendertype = 'basePlane';
		this.basePlane.rendername = this.name;

		// set the inclination
		if( this.inclination > 0 ) {
			this.basePlane.inclination = this.inclination;
			this.basePlane.rotation.set(this.inclination * Math.PI / 180.0, 0, 0);
		}
	},


	// Define animation functions that will be called by the render loop inside if app.js
	// The functions will be invoked
	prepareAnimations: function() {
    var self = this;

    // rotation of the space object
    // not all objects have self rotation, e.g. mercury and moon don't have
    // venus has a negative rotation

    self.animationFunctions.push(function() {

    	// we have rotationPeriod in earth days
    	if( self.rotationPeriod ) {

    		if( self.rotationClockwise === false )
					self.object.rotation.y -= self.app.currentSpeed / (24 * 60 * 60);    	
				else
					self.object.rotation.y += self.app.currentSpeed / (24 * 60 * 60);    	
    	}
    });

    // planet orbit
    if (self.pivot) {
			self.animationFunctions.push(function() {
	    	
				if( self.eccentricity ) {

			    var aRadius = self.semiMajorAxis / window.settings.distancePixelRatio;
			    var bRadius = aRadius * Math.sqrt(1.0 - Math.pow(self.eccentricity, 2.0));

			    // get the current angle
			    // the orbit period is always calculated in days, so here
			    // we need to change it to seconds
			    var angle = self.app.simTimeSecs / (self.siderealOrbitPeriod * 24 * 60 * 60) * Math.PI*2 * -1;

			    self.pivot.position.set(
			    	aRadius * Math.cos(angle) + (self.eccentricity * 100 * self.semiMajorAxis / 100) / window.settings.distancePixelRatio,
			    	0,
			    	bRadius * Math.sin(angle)
			    );
				}
				else
					self.pivot.rotation.y += 1 / self.siderealOrbitPeriod;
			});
    };
    
    // Inject functions array
    self.objectPlane.animate = function() {	
			self.animationFunctions.forEach(function(dt) {
				dt();
			});
    };

	}

});
});

;require.register("views/star_view", function(exports, require, module) {
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
});

;require.register("views/stars_view", function(exports, require, module) {
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
});

;require.register("views/systems_container_view", function(exports, require, module) {
var View = require('./view');

var PopupView = require('./popup_view');

module.exports = View.extend({

	id: 'systems-controls',
  template: require('./templates/systems'),

  events: {
    'click .system': 'showSystemInfo',
    'click .system-setting': 'toggleSystemSetting',
  },

  initialize: function( options ){
    this.app = options.app;
    this.model = options.data;

    this.data = {
      systems: []
    };

    for (var i in this.model) {
      console.log(this.model[i]);
      this.data.systems.push( this.model[i].model );
    }

    this.render();

  	_.bindAll(this, 
      'afterRender', 
      'showSystemInfo', 
      'updateSystemSettings',
      'toggleSystemSetting'
    );
  },

  render: function() {
    this.$el.html(this.template(this.data));
    this.afterRender();
    return this;
  },

  afterRender: function(){
    $('#interface').append(this.$el);
    this.$el.show();
  },

  showSystemInfo: function(e){
    var self = this;
    var el = $(e.currentTarget);

    el.find('system-content').toggle();
  },

  updateSystemSettings: function(e){
    var self = this;
    var el = $(e.currentTarget);
    var type = el.attr('type');
    var system = el.attr('system');

    console.log(el);

  },

  toggleSystemSetting: function(e){
    var self = this;
    var el = $(e.currentTarget);
    var type = $(el).attr('type');
    var systemName = $(el).parent().attr('system');

    $(el).toggleClass('active');

    _.each(self.model, function(model){
      if (model.name == systemName) {
        
        if (type == 'planets') {
          _.each( model.meshes, function( mesh, idx ) {
            if (mesh.visible == true)
              mesh.visible = false;
            else
              mesh.visible = true;
          });
        }

        if (type == 'orbits') {
          _.each( model.orbits, function( orbit, idx ) {
            if (orbit.line) {
              if (orbit.line.material.opacity == 0.0)
                orbit.line.material.opacity = window.settings.orbitTransparency;
              else
                orbit.line.material.opacity = 0.0;  
            }
          });
        }

        if (type == 'labels') {
          $('#labels .planetsystem-' + model.name.replace(' ', '').toLowerCase() ).toggle();
        }

        if (type == 'habitable') {
          if (model.habitableZone.visible == false)
            model.habitableZone.visible = true;
          else
            model.habitableZone.visible = false;
        }

        if (type == 'inclination') {

          _.each( model.meshes, function( mesh, idx ) {
            if (mesh.parent.parent.parent.rotation.x == 0)
              mesh.parent.parent.parent.rotation.x = parseFloat(mesh.parent.parent.parent.inclination) * Math.PI/180;
            else
              mesh.parent.parent.parent.rotation.x = 0;
          });

        }

      }
    });
  }

});
});

;require.register("views/templates/about", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<h3>ExoPlanetSystems - How it works</h3>\n\n<p>The application shows orbital information of planets.</p>\n\n<p>\n  The default view shows the solar system with their planets and orbits. In the background are the stars that have confirmed exoplanets. You can use you mouse to get more information about certain stars by hovering or clicking it. The color of the stars indicates its spectral class. Red stars are mostly small dwarf stars. Where yellow colored stars are mostly sun-like ones. <br/>\n  Stars with habitable exoplanets have green markers in the scene. Those are currently expected to have planets in their habitable zone that might have liquid water on its surface.\n</p>\n\n<p>\n  You can use the blue icons in the top area to change the view of the scene or to search for any planetray system.\n  You can use to display icon to show/hide rendered data of the currently displayed system(s).\n</p>\n\n<p>\n  On the top right corner you can change the speed of the animation. You also can pause the animation if you want.\n</p>\n\n<p>\n  The bottom area shows the current distance from the camera (your screen) to the center of the scene (per default the center shows the Sun). If you zoom you will see how the numbers change. Use it to get a feeling for the large distances between planets and stars.\n</p>\n\n<p>\n  Currently there are planets and moons visible. I am currently working on embedding comets and asteroids as well.\n  (Please note that the positions are not time-related which means the real positions of the bodies are different. This visualization currently shows relative positions ans orbit information only).\n</p>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/animation-controls", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<ul class="menu">\n  <!--\n  <li id="btn-help" class="button" title="Help">\n    <span class="fa fa-question"></span>\n  </li>\n  -->\n  \n  <li id="btn-controls" class="button dark" title="Animation Controls">\n    <img src="img/icons/speed.svg" alt="Speed Icon"/>\n  </li>\n</ul>\n\n<div id="animation-controls-container">\n  <div id="speed-controls">\n    <span class="play-pause-btn" id="play-pause-btn"><i class="fa fa-pause"></i></span>\n    <span class="speed-btn" id="speed-minus"> &minus; </span>\n    <span class="default-speed-btn" title="The Speed of the animation">1&times;</span>\n    <span class="speed-btn" id="speed-plus"> &plus; </span>\n  </div>\n\n  <div id="stars-distance-slider"></div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/app", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
    
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/console", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
    
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/dialog", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="dialog-header">\n\t<span class="close-dialog-btn">&times;</span>\n</div>\n\n<div class="dialog-content">\n\t<h2>');
    
      __out.push(__sanitize(this.headline));
    
      __out.push('</h2>\n\t<p>');
    
      __out.push(__sanitize(this.description));
    
      __out.push('</p>\n</div>\n\n<div class="dialog-form"></div>\n<div class="dialog-footer">\n\t');
    
      if (this.buttons.submit) {
        __out.push('\n\t\t<span class="form-btn submit-btn" rel="start-game">');
        __out.push(__sanitize(this.buttons.submit));
        __out.push('</span>\n\t');
      }
    
      __out.push('\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/help", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div id="help">\n  <h3 class="headline">Help</h3>\n\n  <p>\n    TODO: Give some information about this app\n  </p>\n\n  <p>Discribe the purpose of this app</p>\n  <p>What are exoplanets?</p>\n  <p>Write about how to use this app (controls, Visual settings, interaction with the 3d scene)</p>\n  <p>Tell some Browser infos</p>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/infobox", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<span class="close-btn"> &times; </span>\n<div id="infobox-content"></div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/label", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
    
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/menu", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var m, _i, _len, _ref;
    
      __out.push('<ul class="menu">\n\n  ');
    
      if (this.menu) {
        __out.push('\n    ');
        _ref = this.menu;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          m = _ref[_i];
          __out.push('\n      <li id="');
          __out.push(__sanitize(m.id));
          __out.push('" class="button" title="');
          __out.push(__sanitize(m.title));
          __out.push('">\n        <img src="img/icons/');
          __out.push(__sanitize(m.id));
          __out.push('.svg" alt="Galaxy Icon"/>\n      </li>\n    ');
        }
        __out.push('\n  ');
      } else {
        __out.push('\n\n    <!--\n    <li id="firmament-view" class="button" title="Firmament View ( 10 Bio Light Years) ">\n      <span class="fa fa-globe"></span>\n    </li>\n    <li id="local-group-view" class="button" title="Local Group ( 1 Mio Light Years) ">\n      <span class="fa fa-globe"></span>\n    </li>\n    -->\n\n    <li id="galaxy-view" class="button" title="Galaxy View (25000 Light Years) ">\n     <img src="img/icons/galaxy.svg" alt="Galaxy Icon"/>\n    </li>\n    <li id="star-view" class="button" title="Star View (100 Light Years)">\n      <img src="img/icons/stars.svg" alt="Stars Icon"/>\n    </li>\n    <li id="planet-view" class="button" title="Planet System View (1 AU)">\n      <img src="img/icons/planetsystem.svg" alt="Planetsystem Icon"/>\n    </li>  \n\n    <li id="systems" class="button" title="Show loaded systems"> \n      <img src="img/icons/systems.svg" alt="Systems Icon"/>\n    </li>\n\n    <li id="search" class="button" title="Search by star or planet Name"> \n      <img src="img/icons/search.svg" alt="Search Icon"/>\n    </li>\n    <li id="fullscreen" class="button" title="Toggle Fullscreen (only if your browser supports it)">\n      <img src="img/icons/screen.svg" alt="Fullscreen Icon"/>\n    </li>\n    <li id="settings" class="button" title="Open the Settings">\n      <img src="img/icons/settings.svg" alt="Settings Icon"/>\n    </li>\n  ');
      }
    
      __out.push('\n  \n</ul>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/planet-info", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div id="planet-view-header-left">\n  <img src="img/planets/');
    
      __out.push(__sanitize(this.image));
    
      __out.push('" id="planet-image" title="image based on artist impression"/>\n</div>\n<div id="planet-view-header-right">\n  <h3 class="headline">');
    
      __out.push(__sanitize(this.name));
    
      __out.push('</h3>\n\n  ');
    
      if (this.confirmed) {
        __out.push('\n    <span class="property green">confirmed</span>\n  ');
      } else {
        __out.push('\n    <span class="property red">unconfirmed</span>\n  ');
      }
    
      __out.push('\n\n  ');
    
      if (parseInt(this.habitable) === 1) {
        __out.push('\n    <span class="property green">habitable</span>\n  ');
      } else {
        __out.push('\n    <span class="property red">non-habitable</span>\n  ');
      }
    
      __out.push('\n\n  <div id="actions">\n    <span class="action" action="bindTo">Goto</span>\n  </div>\n</div>\n\n<div id="planet-view-content">\n\n  <div class="content-block">\n\n    <span class="label-headline">Planetary properties</span>\n    <div class="label-group">\n      <span class="label">Distance from earth (LY):</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.distance));
    
      __out.push('</span>\n    </div>\n    <div class="label-group">\n      <span class="label">Radius (earth):</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.radius));
    
      __out.push('</span>\n    </div>\n    <div class="label-group">\n      <span class="label">Mass (earth):</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.masse));
    
      __out.push('</span>\n    </div>\n    <div class="label-group">\n      <span class="label">Mean Temperature (K):</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.temp));
    
      __out.push('</span>\n    </div>\n    <div class="label-group">\n      <span class="label">ESI:</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.esi));
    
      __out.push('</span>\n    </div>\n    <div class="label-group">\n      <span class="label">Habitable:</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.habitable));
    
      __out.push('</span>\n    </div>\n\n    <span class="label-headline">Orbital properties</span>\n    <div class="label-group">\n      <span class="label">Semi Major Axis (AU):</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.semiMajorAxis));
    
      __out.push('</span>\n    </div>\n    <div class="label-group">\n      <span class="label">Sidereal Orbit Period (days):</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.siderealOrbitPeriod));
    
      __out.push('</span>\n    </div>\n    <div class="label-group">\n      <span class="label">Eccentricity:</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.eccentricity));
    
      __out.push('</span>\n    </div>\n    <div class="label-group">\n      <span class="label">Inclination:</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.inclination));
    
      __out.push('</span>\n    </div>\n\n    <span class="label-headline">Misc</span>\n    <div class="label-group">\n      <span class="label">Discovery Method:</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.method));
    
      __out.push('</span>\n    </div>\n     <div class="label-group">\n      <span class="label">Discovery Year:</span>\n      <span class="value">');
    
      __out.push(__sanitize(this.year));
    
      __out.push('</span>\n    </div>\n\n  </div>\n\n</div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/planet-not-found", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('\n<p>title: Planet System not found</p>\n<p>text: The requested planet system could not be found</p>\n<p>type: warning </p>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/popup", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<span class="close-btn"> &times; </span>\n<div id="popup-content"></div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/search-list", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var item, _i, _len, _ref;
    
      _ref = this.data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        __out.push('\n  <li rel="system-');
        __out.push(__sanitize(item.id));
        __out.push('">\n    ');
        __out.push(__sanitize(item.name));
        __out.push(' <span class="text-dark"> | ');
        __out.push(__sanitize(item.planets));
        __out.push(' planets | ');
        __out.push(__sanitize(item.distance));
        __out.push(' parsec</span>\n  </li>\n');
      }
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/search", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div id="search">\n  <h3 class="headline">Search</h3>\n\n  <form action="server/search.php" method="post">\n    <input type="text" name="field-search" autocomplete="off" placeholder="Planet Name or Star" title="Search by stars like <Kepler-90> or <GJ 667> Search planet names like <Kepler-90 b> or <GJ 667 a>" />\n\n    <div class="dynamic"></div>\n  </form>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/settings", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div id="settings">\n  <h3 class="headline">Settings</h3>\n\n  <div class="content-block">\n    <p>Visual Settings</p>\n\n    <span class="field-block">\n      <input type="checkbox" id="checkbox-labels" type="visibility" checked="checked"/>\n      <label for="checkbox-labels">Labels</label>\n    </span>\n\n    <span class="field-block">\n      <input type="checkbox" id="checkbox-named-stars" type="visibility" checked="checked"/>\n      <label for="checkbox-named-stars">Named Stars</label>\n    </span>\n\n    <span class="field-block">\n      <input type="checkbox" id="checkbox-star-lines" type="visibility" checked="checked"/>\n      <label for="checkbox-star-lines">Star Lines</label>\n    </span>\n\n    <span class="field-block">\n      <input type="checkbox" id="checkbox-dwarf-planets" type="visibility" checked="checked"/>\n      <label for="checkbox-dwarf-planets">Dwarf Planets</label>\n    </span>\n\n    <span class="field-block">\n      <input type="checkbox" id="checkbox-orbits" type="visibility" checked="checked"/>\n      <label for="checkbox-orbits">Orbits</label>\n    </span>\n\n    <span class="field-block">\n      <input type="checkbox" id="checkbox-orbit-inclination" type="visibility" checked="checked"/>\n      <label for="checkbox-orbit-inclination">Orbit Inclination</label>\n    </span>\n\n    <span class="field-block">\n      <input type="checkbox" id="checkbox-grid" type="visibility" checked="checked"/>\n      <label for="checkbox-grid">Grid</label>\n    </span>\n\n    <span class="field-block">\n      <input type="checkbox" id="checkbox-distance-rings" type="visibility" checked="checked"/>\n      <label for="checkbox-distance-rings">Distance Rings</label>\n    </span>\n\n  </div>\n\n\n  <div class="content-block">\n    <p>Data Settings</p>\n\n    <span class="field-block">\n      <span>Stars with number of Planets</span>\n      -- range --\n    </span>\n\n    <span class="field-block">\n      <span>Stars Distance</span>\n      -- range --\n    </span>\n\n  </div>\n\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/star-info", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var s, _i, _len, _ref;
    
      __out.push('<h3 class="headline">');
    
      __out.push(__sanitize(this.name));
    
      __out.push('</h3>\n<a href="http://exoplanetsystems.org/system/');
    
      __out.push(__sanitize(this.name));
    
      __out.push('" target="_blank">\n  http://exoplanetsystems.org/system/');
    
      __out.push(__sanitize(this.name));
    
      __out.push('\n</a>\n\n<ul id="tab-list">\n  <li class="active" rel="tab-info">Stellar Info</li>\n  <!-- <li rel="tab-images">Images</li> -->\n  <li rel="tab-planets">Planets</li>\n</ul>\n\n<div id="tabs">\n  <div class="tab active" id="tab-info">\n    <div class="content-block">\n\n      <div class="label-group">\n        <span class="label">Constellation:</span>\n        <span class="value">');
    
      __out.push(__sanitize(this.constellation.name));
    
      __out.push('</span>\n      </div>\n\n      <div class="label-group">\n        <span class="label">Spectral Type:</span>\n        <span class="value">');
    
      __out.push(__sanitize(this.type));
    
      __out.push('</span>\n      </div>\n\n      <div class="label-group">\n        <span class="label">Radius (sun radii):</span>\n        <span class="value">');
    
      __out.push(__sanitize(this.radius));
    
      __out.push('</span>\n      </div>\n\n      <div class="label-group">\n        <span class="label">Mass (sun masses):</span>\n        <span class="value">');
    
      __out.push(__sanitize(this.mass));
    
      __out.push('</span>\n      </div>\n\n      <div class="label-group">\n        <span class="label">Mean Temparature (surface):</span>\n        <span class="value">');
    
      __out.push(__sanitize(this.temp));
    
      __out.push('</span>\n      </div>\n\n      <div class="label-group">\n        <span class="label">Distance from Earth (Parsec)</span>\n        <span class="value">');
    
      __out.push(__sanitize(this.distance));
    
      __out.push('</span>\n      </div>\n\n      <div class="label-group">\n        <span class="label">Distance from Earth (Light Years)</span>\n        <span class="value">');
    
      __out.push(__sanitize(this.distanceLY));
    
      __out.push('</span>\n      </div>\n\n      <div class="label-group">\n        <span class="label">Planets</span>\n        <span class="value">');
    
      __out.push(__sanitize(this.planets));
    
      __out.push('</span>\n      </div>\n\n      <div class="label-group">\n        <span class="label">Habitable Planets</span>\n        <span class="value">');
    
      __out.push(__sanitize(this.habitable));
    
      __out.push('</span>\n      </div>\n\n    </div>\n\n    <div id="actions">\n      <span class="action" action="show">Show Planet System</span>\n      <span class="action" action="moveTo">Goto Planet System</span>\n      <!-- <span class="action" action="calculateDistance">How long to travel there</span> -->\n    </div>\n  </div>\n\n  <!-- <div class="tab" id="tab-images"></div> -->\n\n  <div class="tab" id="tab-planets">\n    <ul id="system-planets">\n      ');
    
      _ref = this.satellites;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        __out.push('\n        <li ');
        if (s.confirmed === 0) {
          __out.push(' class="unconfirmed" ');
        }
        __out.push('>\n          <img src="img/planets/');
        __out.push(__sanitize(s.texture));
        __out.push('" id="planet-image" title="image based on artist impression"/>\n          <span>');
        __out.push(__sanitize(s.name));
        __out.push('</span>\n        </li>\n      ');
      }
    
      __out.push('\n    </ul>\n  </div>\n\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/systems", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var system, _i, _len, _ref;
    
      __out.push('<div id="systems">\n  ');
    
      _ref = this.systems;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        system = _ref[_i];
        __out.push('\n    <div class="system">\n      <span class="system-name">');
        __out.push(__sanitize(system.name));
        __out.push('</span>\n      <div class="system-info">\n        <div class="system-stars"></div>\n        <div class="system-satellites"></div>\n        <div class="system-settings" system="');
        __out.push(__sanitize(system.name));
        __out.push('">\n\n          <span class="system-setting active" type="planets">\n            <i class="fa fa-circle"></i>\n            <span>Planets</span>\n          </span>\n\n          <span class="system-setting active" type="orbits">\n            <i class="fa fa-circle"></i>\n            <span>Orbits</span>\n          </span>\n\n          <span class="system-setting active" type="labels">\n            <i class="fa fa-circle"></i>\n            <span>Labels</span>\n          </span>\n\n          <span class="system-setting" type="habitable">\n            <i class="fa fa-circle"></i>\n            <span>Habitable Zone</span>\n          </span>\n\n          <span class="system-setting active" type="inclination">\n            <i class="fa fa-circle"></i>\n            <span>Inclination (');
        __out.push(__sanitize(system.satellites[0].inclination));
        __out.push('&deg;)</span>\n          </span>\n\n        </div>\n      </div>\n    </div>\n  ');
      }
    
      __out.push('\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/tooltip", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="headline">');
    
      __out.push(__sanitize(this.name));
    
      __out.push('</div>\n\n<div class="property">\n  <div class="label"><span>Type</span></div>\n  <div class="value"><span>');
    
      __out.push(__sanitize(this.type));
    
      __out.push('</span></div>\n</div>\n\n<div class="property">\n  <div class="label"><span>Distance (Parsec)</span></div>\n  <div class="value"><span>');
    
      __out.push(__sanitize(this.distance));
    
      __out.push('</span></div>\n</div>\n\n<div class="property">\n  <div class="label"><span>Distance (Light Years)</span></div>\n  <div class="value"><span>');
    
      __out.push(__sanitize(this.distanceLY));
    
      __out.push('</span></div>\n</div>\n\n<div class="property">\n  <div class="label"><span>Mass (Sun Masses)</span></div>\n  <div class="value"><span>');
    
      __out.push(__sanitize(this.mass));
    
      __out.push('</span></div>\n</div>\n\n<div class="property">\n  <div class="label"><span>Radius (Sun Radii)</span></div>\n  <div class="value"><span>');
    
      __out.push(__sanitize(this.radius));
    
      __out.push('</span></div>\n</div>\n\n<div class="property">\n  <div class="label"><span>Planets</span></div>\n  <div class="value"><span>');
    
      __out.push(__sanitize(this.planets));
    
      __out.push('</span></div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/templates/tour", function(exports, require, module) {
module.exports = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('\n\n<div class="distance distance-1">\n  <p>Description Text for less than 1 Light year</p>\n</div>\n\n<div class="distance distance-10">\n  <p>Description Text for less than 10 Light year</p>\n</div>\n\n<div class="distance distance-1000">\n  <p>Our Milky Way. There are Billions of stars out there. The Milkyway plane is approximately 63° shifted from the sun plane.</p>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
});

;require.register("views/tooltip_view", function(exports, require, module) {
var View = require('./view');

module.exports = View.extend({

	id: null,
  template: require('./templates/tooltip'),

  initialize: function( options ){
  	this.pos = options.pos;
  	this.model = options.data;

  	this.render();

		_.bindAll(this, 'render');
  },

  render: function() {
  	var self = this;

  	$('#tooltip').css({
  		top: self.pos.y + 12,
  		left: self.pos.x + 12
  	});

  	$('#tooltip').show();
  	$('#tooltip').html(self.template(self.model));
  }

});
});

;require.register("views/tour_view", function(exports, require, module) {
var View = require('./view');

module.exports = View.extend({

	id: 'tour',
  template: require('./templates/tour'),

  initialize: function( options ){
  	this.app = options.app;
    this.render();
		_.bindAll(this, 'render', 'update');
  },

  render: function(){
    this.$el.html(this.template());
    this.$el.find('.distance').hide();

    $('body').append(this.$el);
  },

  update: function(){
    var self = this;
    var distance = self.app.currentDistanceLY;

    this.$el.hide();
    this.$el.find('.distance').hide();

    if (distance <= 1) {
      this.$el.find('.distance-1').show();
      this.$el.show();
    }

    if (distance <= 25 && distance > 1) {
      this.$el.find('.distance-10').show();
      this.$el.show();
    }

    if (distance <= 100000 && distance > 1000) {
      this.$el.find('.distance-1000').show();
      this.$el.show();
    }    
  }

});
});

;require.register("views/view", function(exports, require, module) {
// Base class for all views.
module.exports = Backbone.View.extend({
  initialize: function() {
    this.render = _.bind(this.render, this);
  },

  template: function() {},
  
  getRenderData: function() {
    if(this.model)
      return this.model.toJSON();
    else
      return {};
  },

  render: function() {
    this.$el.html(this.template(this.getRenderData()));
    this.afterRender();
    return this;
  },

  afterRender: function() {},

  destroy: function(){
    if(this.model)
      this.model.off(null, null, this);

    this.$el.remove();
  }
});

});

;
//# sourceMappingURL=app.js.map