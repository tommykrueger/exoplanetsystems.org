// Base class for all models.
module.exports = Backbone.Model.extend({
  initialize: function(values){
    Backbone.Model.prototype.initialize.call(this, values);
  },

  // Generates a JSON representation of this model
  toJSON: function(){
    var data = Backbone.Model.prototype.toJSON.call(this);
    return data;
  }

});
