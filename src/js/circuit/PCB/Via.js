define(
	[
	 	"./Thermal",
	 	"./parseFlags"
	],
	function(
		Thermal,
		parseFlags
	){

		var Via = function(x, y, od, clearance, u2, id, u3, flags) {

			this.x = x;
			this.y = y;
			this.od = od;
			this.id = id;
			this.clearance = clearance;
			this.flags = parseFlags(Via._defaultFlags, flags);

		};

		Via._defaultFlags = {
		};

		Via.prototype.render = function(ctx) {
	
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.od / 2, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fillStyle = '#7F7F7F'; // TODO: set colors to global option
			ctx.fill();
	
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.id / 2, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fillStyle = '#E5E5E5'; // TODO: set colors to global option
			ctx.fill();
	
		};
	
		Via.prototype.clear = function(ctx, layerNumber){

			var thrm = this.flags.thermal;
			if(thrm){
				thrm = Thermal.findThermal(thrm, layerNumber);
				if(thrm)
					thrm.clear(ctx, this.x, this.y, this.clearance, this.od, this.id);
			}

			if(!thrm){
				ctx.beginPath();
				ctx.arc(this.x, this.y, (this.clearance + this.od) / 2.0, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.fill();
			}

		};

		Via.prototype.clearInner = function(ctx){

			ctx.beginPath();
			ctx.arc(this.x, this.y, this.id / 2.0, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();

		};

		Via.prototype.renderGL = function(gl, shaderProgram){
	
			gl.uniform1f(shaderProgram.roundPointsUniform, true);
	
			gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.pointBuffer.itemSize, gl.FLOAT, false, 0, 0);

			gl.uniform1f(shaderProgram.innerRadiusUniform, 0.0);
	
			gl.uniform4f(shaderProgram.vColorUniform, 0.59, 0.59, 0.59, 1.0);
			gl.uniform1f(shaderProgram.pointsizeUniform, this.od*gl.scaleFactor);
			gl.drawArrays(gl.POINTS, 0, this.pointBuffer.numItems);
	
			gl.uniform4f(shaderProgram.vColorUniform, 0.74, 0.74, 0.74, 1.0);
			gl.uniform1f(shaderProgram.pointsizeUniform, this.id*gl.scaleFactor);
			gl.drawArrays(gl.POINTS, 0, this.pointBuffer.numItems);
	
			gl.uniform1f(shaderProgram.roundPointsUniform, false);
	
		}
	
		Via.prototype.clearGL = function(gl, shaderProgram, layerNumber){
	
			var thrm = this.flags.thermal;
			if(thrm){
				thrm = Thermal.findThermal(thrm, layerNumber);
				if(thrm)
					thrm.clearGL(gl, shaderProgram, this.x, this.y, this.pointBuffer, this.clearance, this.od, this.id);
			}

			if(!thrm){
				gl.uniform1f(shaderProgram.roundPointsUniform, true);

				gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
				gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.pointBuffer.itemSize, gl.FLOAT, false, 0, 0);

				gl.uniform1f(shaderProgram.innerRadiusUniform, 0.0);

				gl.uniform1f(shaderProgram.pointsizeUniform, (this.od + this.clearance) * gl.scaleFactor);
				gl.drawArrays(gl.POINTS, 0, this.pointBuffer.numItems);

				gl.uniform1f(shaderProgram.roundPointsUniform, false);
			}
	
		};
	
		Via.prototype.cleanupGL = function(gl){
	
			if(this.pointBuffer){
				gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, 1, gl.STATIC_DRAW);
				gl.deleteBuffer(this.pointBuffer);
				this.pointBuffer = null;
			}
	
		}

		Via.prototype.clearInnerGL = function(gl, shaderProgram){
			gl.uniform1f(shaderProgram.roundPointsUniform, true);

			gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.pointBuffer.itemSize, gl.FLOAT, false, 0, 0);

			gl.uniform1f(shaderProgram.innerRadiusUniform, 0.0);

			gl.uniform1f(shaderProgram.pointsizeUniform, this.id * gl.scaleFactor);
			gl.drawArrays(gl.POINTS, 0, this.pointBuffer.numItems);

			gl.uniform1f(shaderProgram.roundPointsUniform, false);
		};

		Via.prototype.setup3DArrayBuffer = function(gl){
	
			var vBuffer;
			vBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([this.x,this.y,0.0]), gl.STATIC_DRAW);
			vBuffer.itemSize = 3;
			vBuffer.numItems = 1;
			this.pointBuffer = vBuffer;
	
		}
	
		return Via;

	}
);