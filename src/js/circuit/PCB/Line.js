define(
	[
	 	'./ElementLine',
	 	'Util/Class'
	],
	function(
		ElementLine,
		Class
	){

		var Line = function(x1, y1, x2, y2, thick, clearance, flags){
	
			ElementLine.call(this, x1, y1, x2, y2, thick);

			this.clearance = clearance;
			this.flags = 
			{
				clearline: false
			};

			if(flags){
				var split = flags.split(','), i;

				for(i = 0; i < split.length; i++){
					this.flags[split[i]] = true;
				}
			}

		};
	
		Class.extend(ElementLine, Line);

		Line.prototype.clearGL = function(gl, shaderProgram){

			if(this.flags.clearline){

				gl.bindBuffer(gl.ARRAY_BUFFER, this.clearBuffer);
				gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.clearBuffer.itemSize, gl.FLOAT, false, 0, 0);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.clearBuffer.numItems);
	
				gl.uniform1f(shaderProgram.innerRadiusUniform, 0.0);
	
				gl.uniform1f(shaderProgram.pointsizeUniform, (this.thick + this.clearance) * gl.scaleFactor);
				gl.uniform1f(shaderProgram.roundPointsUniform, true);
				gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
				gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.pointBuffer.itemSize, gl.FLOAT, false, 0, 0);
				gl.drawArrays(gl.POINTS, 0, this.pointBuffer.numItems);
				gl.uniform1f(shaderProgram.roundPointsUniform, false);

			}

		};

		Line.prototype.setup3DArrayBuffer = function(gl, x, y){

			var vBuffer, ox1, oy1, ox2, oy2;

			ox1 = this.x1;
			oy1 = this.y1;
			ox2 = this.x2;
			oy2 = this.y2;

			if(this.parent){
				ox1 += this.parent.mx;
				oy1 += this.parent.my;
				ox2 += this.parent.mx;
				oy2 += this.parent.my;
			}

			this.vertexBuffer = this.generateLineBuffer(gl, this.thick);
			this.clearBuffer = this.generateLineBuffer(gl, (this.thick + this.clearance));

			vBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ox1,oy1,0.0,ox2,oy2,0.0]), gl.STATIC_DRAW);
			vBuffer.itemSize = 3;
			vBuffer.numItems = 2;
			this.pointBuffer = vBuffer;

		};
		
		return Line;

	}
);