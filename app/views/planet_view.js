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