define(
	[
	 	"Graphics/glMatrix"
	],
	function(
		glMatrix
	){

		var Text = function(pcbv, x, y, angle, scaling, str, flags){
	
			this.pcbv = pcbv;
			this.x = x;
			this.y = y;
	
			switch(angle){
				case 0:
					this.angle = 0;
					break;
				case 1:
					this.angle = -0.5*Math.PI;
					break;
				case 2:
					this.angle = Math.PI;
					break;
				case 3:
					this.angle = 0.5*Math.PI;
					break;
			}
	
			this.scaling = scaling;
			this.str = str;
			this.flags = flags;

		};
	
		Text.prototype.render = function(ctx, color){
	
			var sym;
	
			ctx.save();
	
			ctx.translate(this.x, this.y);
			ctx.rotate(this.angle);
	
			if(this.angle == Math.PI) ctx.scale(1, -1);
	
			for(var i = 0; i < this.str.length; i++){
				sym = this.pcbv.symbols[this.str[i]];
				sym.render(ctx, color);
				ctx.translate(sym.width+1000, 0);
			}
	
			ctx.restore();
	
		};
	
		Text.prototype.renderGL = function(gl, shaderProgram){

			var sym, mvMatrix;
	
			mvMatrix = glMatrix.mat4.create();
			glMatrix.mat4.set(gl.mvMatrix, mvMatrix);

			glMatrix.mat4.translate(gl.mvMatrix, [this.x, this.y, 0.0]);
			glMatrix.mat4.rotateZ(gl.mvMatrix, this.angle)
			if(this.angle == Math.PI)
				glMatrix.mat4.scale(gl.mvMatrix, [1.0, -1.0, 1.0]);
	        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, gl.mvMatrix);

	        for(var i = 0; i < this.str.length; i++){
	
				sym = this.pcbv.symbols[this.str[i]];
				sym.renderGL(gl, shaderProgram);
	
				glMatrix.mat4.translate(gl.mvMatrix, [sym.width + 1000.0, 0.0, 0.0]);
		        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, gl.mvMatrix);

			}

			glMatrix.mat4.set(mvMatrix, gl.mvMatrix);
	        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

		}
	
		Text.prototype.cleanupGL = function(gl){}

		Text.prototype.setup3DArrayBuffer = function(gl, x, y){
			//
		}
		
		return Text;

	}
);