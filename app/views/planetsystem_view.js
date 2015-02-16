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