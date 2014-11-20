define(
	[
	 	"./Pin",
	 	"Graphics/glMatrix"
	],
	function(
		Pin,
		glMatrix
	){

		// Element [element_flags, description, pcb-name, value, mark_x, mark_y,
		// text_x, text_y, text_direction, text_scale, text_flags]
		var Element = function(pcbv, flags, desc, refdes, val, mx, my,
				tx, ty, txtdir, txtscl, txtflg) {
	
			this.pcbv = pcbv;
			this.desc = desc;
			this.refdes = refdes;
			this.mx = mx;
			this.my = my;
			this.tx = tx;
			this.ty = ty;
			this.txtdir = txtdir;
			this.txtscl = txtscl;
			this.txtflg = txtflg;
			this.parts = [];
	
			this.flags = {
				hidename: false,
				onsolder: false
			};

			var split = flags.split(','), i;

			for(i = 0; i < split.length; i++)
				this.flags[split[i]] = true;

		};
	
		Element.prototype.onsolder = function() {
	
			return this.flags.onsolder;
	
		};
	
		Element.prototype.render = function(ctx, color, mirror,	pins_only) {
	
			var i, sym, rot = 0;
	
			ctx.save();
	
			ctx.translate(this.mx, this.my);
	
			for (i = 0; i < this.parts.length; i++) {
				if (pins_only) {
					if (this.parts[i] instanceof Pin)
						this.parts[i].render(ctx, color);
				} else {
					this.parts[i].render(ctx, color);
				}
			}
	
			if (pins_only) {
				ctx.restore();
				return;
			}

			if(!this.flags.hidename){

				switch(this.txtdir) {
					case 0:
						rot = 0;
						break;
					case 1:
						rot = -0.5 * Math.PI;
						break;
					case 2:
						rot = Math.PI;
						break;
					case 3:
						rot = 0.5 * Math.PI;
						break;
				}
		
				ctx.save();
				ctx.translate(this.tx, this.ty);
		
				if (mirror)
					ctx.scale(1, -1);
		
				ctx.rotate(rot);
		
				for (i = 0; i < this.refdes.length; i++) {
					sym = this.pcbv.symbols[this.refdes[i]];
					sym.render(ctx, color);
					ctx.translate(sym.width + 1000, 0);
				}
		
				ctx.restore();
			}
	
			ctx.restore();
	
		};

		Element.prototype.renderText = function(gl, shaderProgram){

			var sym, rot, mvMatrix;

			switch(this.txtdir) {
				case 0:
					rot = 0;
					break;
				case 1:
					rot = -0.5 * Math.PI;
					break;
				case 2:
					rot = Math.PI;
					break;
				case 3:
					rot = 0.5 * Math.PI;
					break;
			}

			mvMatrix = glMatrix.mat4.create();
			glMatrix.mat4.set(gl.mvMatrix, mvMatrix);
			glMatrix.mat4.translate(gl.mvMatrix, [this.mx, this.my, 0.0]);
			glMatrix.mat4.translate(gl.mvMatrix, [this.tx, this.ty, 0.0]);

			//if(mirror)
			//	ctx.scale(1, -1);

			glMatrix.mat4.rotateZ(gl.mvMatrix, rot)

			gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, gl.mvMatrix);

			for (i = 0; i < this.refdes.length; i++) {

				sym = this.pcbv.symbols[this.refdes[i]];
				sym.renderGL(gl, shaderProgram);

				glMatrix.mat4.translate(gl.mvMatrix, [sym.width + 1000.0, 0.0, 0.0]);
		        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, gl.mvMatrix);

			}

			glMatrix.mat4.set(mvMatrix, gl.mvMatrix);
	        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

		}

		Element.prototype.renderGL = function(gl, shaderProgram){

			if(!this.flags.hidename)
				this.renderText(gl, shaderProgram);

			//var i;
			//for(i = 0; i < this.parts.length; i++)
				//this.parts[i].renderGL(gl, shaderProgram);

		}

		Element.prototype.clearGL = function(gl, shaderProgram){};

		Element.prototype.cleanupGL = function(gl){

			var i;
			for(i = 0; i < this.parts.length; i++)
				this.parts[i].cleanupGL(gl);

		}

		Element.prototype.setup3DArrayBuffer = function(gl, x, y){
	
			//var i;
			//for(i = 0; i < this.parts.length; i++)
			//	this.parts[i].setup3DArrayBuffer(gl, this.mx, this.my);
	
		}
	
		return Element;

	}
);