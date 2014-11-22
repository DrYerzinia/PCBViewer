#define M_PI 3.1415926535897932384626433832795
#define M_SQRT_2 1.41421356237

precision mediump float;

uniform vec4 vColor;

uniform float innerRadius;
uniform float startAngle;
uniform float sweep;
uniform float shaveInside;

uniform bool arcEnabled;
uniform bool roundPoints;
uniform bool inverted;
uniform bool shaveFF;

void main(void) {
	if(roundPoints){

		float dist = distance(gl_PointCoord, vec2(0.5));
		if(dist > 0.5 || dist < innerRadius)
    		discard;

		if(arcEnabled){

			float sx = gl_PointCoord.x - 0.5;
			float sy = gl_PointCoord.y - 0.5;
			if(shaveFF){
				float sx2 = (sx + sy)/M_SQRT_2;
				float sy2 = (sy - sx)/M_SQRT_2;
				sx = sx2;
				sy = sy2;
			}
			if(abs(sx) < shaveInside || abs(sy) < shaveInside)
				discard;

			float y_dif = gl_PointCoord.y - 0.5;
			if(inverted)
				y_dif = y_dif * -1.0;

			float ang = atan(y_dif, gl_PointCoord.x - 0.5);
			if(startAngle + sweep > M_PI){
				if(ang < startAngle && ang > startAngle + sweep - M_PI * 2.0)
					discard;
			} else {
				if(ang < startAngle || ang > startAngle + sweep)
					discard;
			}
		}
	}

	gl_FragColor = vColor;

}