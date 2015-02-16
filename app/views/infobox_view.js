var View = require('./view');
var PopupView = require('./popup_view');

module.exports = View.extend({

	id: 'infobox',
  template: require('./templates/infobox'),

  events: {
  	'click .close-btn': 'close',
    'click #actions .action': 'doAction',
    'click #tab-list li': 'tab'
  },

  initialize: function( options ){
  	this.app = options.app;
    this.object = options.object;
    this.model = options.data;
    this.content = require('./templates/' + options.template);

  	_.bindAll(this, 
      'render', 
      'close',
      'doAction',
      'tab',
      'loadImages'
    );

    console.log(options);

    if (this.model.texture)
      this.model.image = this.model.texture;

    // read the planet infos for this stellar system
    var self = this;
    var satellites = null;
    _.each(this.app.planetsystems.models, function(system, index){
      if (system.get('name') === self.model.name) {
        satellites = system.get('satellites');
      }
    }); 

    this.model.satellites = satellites;
    this.render();
  },

  render: function(){
    var self = this;

    $('#' + self.id).remove();
    $('body').append(self.$el.html(self.template()));
    $('#infobox-content').html(this.content(self.model));

    this.loadImages($('#tab-images'));
  },

  close: function(e){
    e.preventDefault();
    $('#' + this.id).remove();
  },

  doAction: function(e){
    var self = this;
    e.preventDefault();

    var action = $(e.currentTarget).attr('action');

    if (action == 'show') {
      self.app.addSystem(this.model.id);
    }

    if (action == 'moveTo') {
      // animate the camera to the new location
      self.app.config.distance.value = 1;
      self.app.config.distance.type = 'au';
      self.app.cameraHelper.bindObject = self.model;
      self.app.cameraHelper.moveTo(self.app.camera.position, self.model.position, 5000, function(){
        self.app.cameraHelper.bindObject = null
      });

      // also load the system after the camera has been moved there
      self.app.addSystem(self.model.id);
    }

    if (action == 'bindTo') {
      self.app.animationControlsView.pause();
      self.app.cameraHelper.bindTo(self.object, self.model.position);
    }
  },

  tab: function(e){
    var $el = $(e.currentTarget);
    var container = $el.attr('rel');

    $('#tab-list li').removeClass('active');
    $el.addClass('active');

    $('#tabs .tab').removeClass('active');
    $('#tabs #' + container).addClass('active');
  },

  loadImages: function( el ){
    var name = this.model.name;
        name = 'planetary system ' + name;

    $.getJSON('http://ajax.googleapis.com/ajax/services/search/images?v=1.0&start=0&rsz=5&q='+ name +'&callback=?', function(data) {
      var images = data.responseData.results;

      var $ul = $('<ul/>');
          $ul.prepend('<p>Image data provided by Google Search</p>')

      for (i in images) {
        var url = images[i].url;
        var $li = $('<li/>');
            $li.append('<img src="'+ url +'" />');

        $ul.append( $li );
      }

      el.html( $ul );

    });
  },

  showLoading: function(){
    $('#loading').fadeIn();
  },

  hideLoading: function(){
    $('#loading').fadeOut();
  }

});