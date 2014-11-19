define(
	function(){
	
		var GLHelper = {};

		GLHelper.createShader = function(gl, type, shaderText){

			var shader;

			shader = gl.createShader(type);
			gl.shaderSource(shader, shaderText);
			gl.compileShader(shader);

			if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
				console.log(gl.getShaderInfoLog(shader));
				return null;
			}

			return shader;

		}

		GLHelper.createProgram = function(gl, vertexShader, fragmentShader){

			var program = gl.createProgram();

			gl.attachShader(program, vertexShader);
			gl.attachShader(program, fragmentShader);
			gl.linkProgram(program);

	        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	            console.log("Error: Could not initialise shaders");
	            return null;
	        }

			return program;

		}

		return GLHelper;

	}
);