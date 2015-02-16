<?php header('Content-Type: text/html; charset=utf-8');?>
<!doctype html>
<html>
  <head>
    <title>ExoPlanetSystems - A Visualization of Exoplanet Systems</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">

    <meta name="description" content="ExoPlanetSystems - a Visualization for Exoplanet Systems" />
    <meta name="keywords" content="ExoPlanetSystems, visualization of exoplanets, exoplanets, planet systems, 3d visualization, solar system, WebGL, three.js" />
    <meta name="author" content="Tommy Krüger" />
    <meta name="robots" content="all" />
    <meta name="google-site-verification" content="RtzyxwlSL4KZFPywhDvPtSzF00poBVw-lQ3fvHRtPu8" />

    <link rel="shortcut icon" href="img/favicon.png" />
    <link rel="alternate" href="http://exoplanetsystems.org" hreflang="en-us" />

    <link rel="stylesheet" href="stylesheets/app.css">
    <link href="//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css" rel="stylesheet">

  </head>
<body>

  <div id="loader">
    <span>Loading Planetary Data</span>
    <span class="fa fa-spin fa-spinner"></span>
  </div>

  <!-- three.js container -->
  <div id="container">
    <canvas id="canvas"></canvas>
  </div>

  <!-- the app interface that holds the html content -->
  <div id="interface">
    <div id="logo">
      <span id="title">ExoPlanetSystems</span>
      <span id="subtitle">visualizing planetary systems</span>
    </div>
  </div>
  <div id="tooltip"></div>
  <div id="systems"></div>

  <div id="footer">

    <span id="loading"> loading in progress ... </span>

    <ul id="distances">
      <li><span id="distance-km"></span> KM</li>
      <li><span id="distance-au"></span> AU</li>
      <li><span id="distance-ly"></span> Light Years</li>
      <li><span id="distance-pc"></span> Parsec</li>
    </ul>

    <span id="copyright"> &copy; 2013-<?php echo date('Y')?> by Tommy Krüger</span>
  </div>

  <div id="labels"></div>
  <div id="star-labels"></div>

  <!-- info on screen display -->
  <!--
  <div id="info">
    <div class="bottom" id="inlineDoc" >
      - <i>p</i> for screenshot
    </div> 
  </div> 
  -->

  <div id="console"></div>

  <script type="text/javascript" src="javascripts/vendor.js"></script>
  <script type="text/javascript" src="javascripts/app.js"></script>
  <script>require('initialize');</script>
  <script>
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-23558535-9', 'auto');
    ga('send', 'pageview');
  </script>

</body>
</html>
