var View = require('./view');
var SearchList = require('./search_list');

module.exports = View.extend({

	id: 'popup',
  template: require('./templates/popup'),

  events: {
  	'click .close-btn': 'close',
    'mouseover #popup': 'hovered',
    'change input[type=checkbox]': 'checkboxClicked',
    'keyup input[name=field-search]': 'search'
  },

  initialize: function( options ){
  	this.app = options.app;
    this.content = require('./templates/' + options.template);

    this.model = options.data || {};

  	_.bindAll(this, 
      'render', 
      'close', 
      'hovered', 
      'checkboxClicked', 
      'search',
      'toggleVisibility'
    );

    this.render();
  },

  render: function(){
    var self = this;
    var data = {data: self.model};

    $('#' + self.id).remove();
    $('body').append(this.$el.html(this.template(data)));
    $('#popup-content').html(this.content(data));

    this.$el.css({
      'margin-left': - $(self.$el).outerWidth() / 2,
      'margin-top': - $(self.$el).outerHeight() / 2
    });
  },

  close: function(e){
    e.preventDefault();
  	
    $('#' + this.id).remove();
  },

  hovered: function(e){
    e.preventDefault();
    e.stopPropagation();
  },

  checkboxClicked: function(e){
    var type = $(e.currentTarget).attr('type');
    var id = $(e.currentTarget).attr('id');

    switch(id) {
      case 'checkbox-labels':
        $('#labels').toggleClass('hidden');
        $('#star-labels').toggleClass('hidden');
      break;
      case 'checkbox-orbits':
        window.settings.showOrbits = !window.settings.showOrbits;
      break;
      case 'checkbox-orbit-inclination':
        window.settings.showInclination = !window.settings.showInclination;
      break;
      case 'checkbox-distance-rings':
        window.settings.showDistances = !window.settings.showDistances;
      break;
    }
  },

  toggleVisibility: function(object){

  },

  search: function(e){
    var self = this;
    var $el = $(e.currentTarget);
    var key = $el.val().toLowerCase();

    if ( key.length >= 3 ) {

      // 1. search by planet name (ex: Kepler-90 b)
      // 2. search by star name (ex: Kepler-90 b)
      // 3. search planets by constellation name (ex: And or Andromeda)

      var data = [];
      _.each(self.app.planetsystems.models, function(planetsystem){
        var n = planetsystem.get('name').toLowerCase();
        if (n == key || n.indexOf(key) > -1)
          data.push(planetsystem.attributes);
      });

      _.each(self.app.constellations.models, function(constellation){
        var n = constellation.get('name').toLowerCase();
        if (n == key || n.indexOf(key) > -1)
          data.push(constellation.attributes);
      });

      var searchList = new SearchList({app: self.app, model: {data: data}});
      $el.parent().find('.dynamic').html( searchList.render().el );
    }
  },

  showLoading: function(){
    $('#loading').fadeIn();
  },

  hideLoading: function(){
    $('#loading').fadeOut();
  }

});