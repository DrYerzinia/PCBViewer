define(
	[
	 	'../Layer'
	],
	function(
		Layer
	){
	
		// ElementArc [x y r1 r2 startangle sweepangle thickness]
		var ElementArc = function(x, y, r1, r2, start, sweep, thick) {

			if(sweep < 0){
				start += sweep;
				sweep = Math.abs(sweep);
			}
			if(start < 0) start += 360;

			start = start / 180.0 * Math.PI;
			sweep = sweep / 180.0 * Math.PI;

			this.x = x;
			this.y = y;
			this.r1 = r1;
			this.r2 = r2;
			this.start = start;
			this.sweep = sweep;
			this.thick = thick;
	
		};
	
		ElementArc.prototype.render = function(ctx, color) {

			if(!this._cache){
				this._cache = {}
				this._cache.x = this.x;
				this._cache.y = this.y;
				if(this.parent){
					this._cache.x += this.parent.mx;
					this._cache.y += this.parent.my;
				}
			}

			ctx.beginPath();
			ctx.arc(
				this._cache.x,
				this._cache.y,
				this.r1,
				(Math.PI * 2) - this.start,
				(Math.PI * 2) - (this.start + this.sweep),
				false
			);
			ctx.lineCap = 'round';
			ctx.lineWidth = this.thick;
			ctx.strokeStyle = color;
			ctx.stroke();
			ctx.closePath();
	
		};

		ElementArc.prototype.clear = function(ctx){};

		ElementArc.prototype.renderGL = function(gl, shaderProgram){
	
			var outerRadius, innerRadius, radiusRatio;
	
			outerRadius = this.r2 + this.r1 + this.thick;
			innerRadius = this.r2 + this.r1 - this.thick;
			radiusRatio = innerRadius / outerRadius / 2;

			gl.uniform1f(shaderProgram.roundPointsUniform, true);
			gl.uniform1f(shaderProgram.arcEnabledUniform, true);
			if(gl.side == Layer.SOLDER)
				gl.uniform1f(shaderProgram.invertedUniform, true);
			else
				gl.uniform1f(shaderProgram.invertedUniform, false);
			gl.uniform1f(shaderProgram.startAngleUniform, this.start - Math.PI);
			gl.uniform1f(shaderProgram.sweepUniform, this.sweep);

			gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.pointBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
			gl.uniform1f(shaderProgram.pointsizeUniform, outerRadius * gl.scaleFactor);
			gl.uniform1f(shaderProgram.innerRadiusUniform, radiusRatio);
			gl.drawArrays(gl.POINTS, 0, this.pointBuffer.numItems);
	
			gl.uniform1f(shaderProgram.startAngleUniform, this.start - Math.PI);
			gl.uniform1f(shaderProgram.sweepUniform, this.sweep);
			gl.uniform1f(shaderProgram.arcEnabledUniform, false);
			gl.uniform1f(shaderProgram.roundPointsUniform, false);
	
		};

		ElementArc.prototype.clearGL = function(gl, shaderProgram){};

		ElementArc.prototype.cleanupGL = function(gl){

			if(this.pointBuffer){
				gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, 1, gl.STATIC_DRAW);
				gl.deleteBuffer(this.pointBuffer);
				this.pointBuffer = null;
			}

		};

		ElementArc.prototype.setupGL = function(gl){

			var x, y;

			x = this.x;
			y = this.y;
			if(this.parent){
				x += this.parent.mx;
				y += this.parent.my
			}

			var vBuffer;
			vBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x, y, 0.0]), gl.STATIC_DRAW);
			vBuffer.itemSize = 3;
			vBuffer.numItems = 1;
			this.pointBuffer = vBuffer;
	
	
		};
	
		return ElementArc;

	}
);