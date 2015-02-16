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
