attribute float size;
attribute vec3 ca;
attribute float alpha;

varying vec3 vColor;
varying float vAlpha;

void main() {

  vAlpha = alpha;
  vColor = ca;

  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

  gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );
  gl_Position = projectionMatrix * mvPosition;

}