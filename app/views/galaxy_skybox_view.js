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
