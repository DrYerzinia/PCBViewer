attribute vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform float pointsize;

void main(void) {

	gl_PointSize = pointsize;
	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

}