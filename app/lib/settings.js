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

