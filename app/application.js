Application = {
  initialize: function() {
    var Router = require('lib/router');
    var Settings = require('lib/settings');
    var Utils = require('lib/utils');

    // new Settings();
    // new Utils();

    this.router = new Router();
    // this.loaderView = new Loader();

    if (typeof Object.freeze === 'function') 
      Object.freeze(this);
  }
}

module.exports = Application;
