attribute float size;
attribute vec3 ca;
attribute float alpha;
attribute float rotation;

varying vec3 vColor;
varying float vRotation;
varying float vAlpha;

void main() {

  vAlpha = alpha;
  vColor = ca;
  vRotation = rotation;

  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

  gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );
  gl_Position = projectionMatrix * mvPosition;

}