precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
	vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
	if(textureColor.a == 1.0)
		textureColor.a = 0.75;
	gl_FragColor = textureColor;
}