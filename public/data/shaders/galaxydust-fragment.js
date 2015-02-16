uniform vec3 color;
uniform sampler2D texture;

varying vec3 vColor;
varying float vRotation;
varying float vAlpha;

void main() {

	float mid = 0.5;
  vec2 rotated = vec2(cos(vRotation) * (gl_PointCoord.x - mid) + sin(vRotation) * (gl_PointCoord.y - mid) + mid,
                      cos(vRotation) * (gl_PointCoord.y - mid) - sin(vRotation) * (gl_PointCoord.x - mid) + mid);
      
  gl_FragColor = vec4( color * vColor, vAlpha );
  gl_FragColor = gl_FragColor * texture2D( texture, rotated );

}