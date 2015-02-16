
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
