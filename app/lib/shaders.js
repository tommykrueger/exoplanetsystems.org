
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
