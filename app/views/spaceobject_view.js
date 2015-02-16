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