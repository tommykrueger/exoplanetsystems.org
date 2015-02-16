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
