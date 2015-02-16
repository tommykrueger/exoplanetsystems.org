var View = require('./view');

var PopupView = require('./popup_view');

module.exports = View.extend({

	id: 'animation-controls',
  template: require('./templates/animation-controls'),

  events: {
    'click #btn-help': 'showHelp',
  	'click #btn-controls': 'toggleControlsContainer',
    'click #play-pause-btn': 'pause',
    'click .speed-btn': 'changeSpeed'
  },

  initialize: function( options ){
    this.app = options.app;

  	_.bindAll(this, 
      'showHelp',
      'toggleControlsContainer',
      'pause',
      'changeSpeed',
      'afterRender'
    );
  
  },

  afterRender: function(){
    var self = this;

    console.log('intitializing slider');

    $('#stars-distance-slider').slider({
      range: true,
      min: window.settings.stars.minDistance,
      max: window.settings.stars.maxDistance,
      step: 10,
      values: [window.settings.stars.minDistance, window.settings.stars.maxDistance],
      slide: function( event, ui ) {
        $('#stars-distance-amount').text( ui.values[0] + ' - ' + ui.values[1] + ' LY');

        window.settings.stars.minDistance = ui.values[0];
        window.settings.stars.maxDistance = ui.values[1];

        // remove all stars first
       // App.scene.remove( App.particleStars );
        //App.stars = [];
        //App.particleStars = new ParticleStars( App, App.loadedStars);  
        self.app.particleStars.filter();
        //App.particleStars.filter();     
      }
    });

  },

  showHelp: function(){
    var self = this;
     new PopupView({ app:self.app, template: 'help'});
  },

  toggleControlsContainer: function(event){
  	this.$('#animation-controls-container').toggle();
  },

  pause: function(e){
    console.log('paused');

    if (e !== undefined) {
      var self = $(e.currentTarget);

      if ( self.hasClass('paused') ) {
        this.app.currentSpeed = this.app.defaultSpeed;
        self.find('i').removeClass('fa-play');
        self.find('i').addClass('fa-pause');
        self.removeClass('paused');

      } else {
        this.app.currentSpeed = 0;
        self.find('i').removeClass('fa-pause');
        self.find('i').addClass('fa-play');
        self.addClass('paused');
      }
    } else {
      this.app.currentSpeed = 0;
      $('#play-pause-btn').find('i').removeClass('fa-pause');
      $('#play-pause-btn').find('i').addClass('fa-play');
      $('#play-pause-btn').addClass('paused');
    }
    

    $('.default-speed-btn').html( this.app.currentSpeed / this.app.defaultSpeed + '&times;');
  },


  changeSpeed: function(e){

    if( $(e.currentTarget).attr('id') == 'speed-plus' ) {
      this.app.currentSpeed *= 2;
    } else {
      this.app.currentSpeed /= 2;
    }

    console.log('set speed to', this.app.currentSpeed);

    var newSpeed = this.app.currentSpeed / this.app.defaultSpeed;

    if( newSpeed < 1 ) {
      newSpeed = newSpeed.toFixed(4);
    }

    $('.default-speed-btn').html( newSpeed + '&times;');
  },

  defaultSpeed: function(){
    console.log('set speed to', this.app.defaultSpeed);
    this.app.currentSpeed = this.app.defaultSpeed;
    $('.default-speed-btn').html( this.app.currentSpeed / this.app.defaultSpeed + '&times;');
  }

});