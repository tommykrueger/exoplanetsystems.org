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







