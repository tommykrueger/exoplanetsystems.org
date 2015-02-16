exports.config =
  # See docs https://github.com/brunch/brunch/blob/master/docs/config.md

  # minify js files
  # optimize: true

  # concat js and css files
  files:
    javascripts:
      defaultExtension: 'js'
      joinTo:
        'javascripts/app.js': /^app/
        'javascripts/vendor.js': /^vendor/
      order:
        before: [
          # libraries
          'vendor/lib/jquery.min.js',
          'vendor/lib/jquery-ui.js',
          'vendor/lib/underscore.min.js',
          'vendor/lib/backbone-min.js',
          'vendor/lib/three.min.js',
          'vendor/lib/three.extensions.js'
        ]

    stylesheets:
      defaultExtension: 'styl'
      joinTo: 'stylesheets/app.css'
      order:
        before: [
          'vendor/styles/normalize.css',
          'vendor/styles/jquery-ui.css'
        ]

    templates:
      defaultExtension: 'eco'
      joinTo: 'javascripts/app.js'