var Model = require('./model');

module.exports = Model.extend({

	intitialize : function(values){
		Model.prototype.initialize.call(this, values);
	}

});