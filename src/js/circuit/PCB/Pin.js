define(
	[
	 	"./parseFlags"
	],
	function(
		parseFlags
	){
	
		// Pin [x y thickness clearance mask drillholedia name number flags]
		var Pin = function(x, y, thick, clearance, mask, drill, name, num, flags) {
	
			this.x = x;
			this.y = y;
			this.thick = thick;
			this.clearance = clearance;
			this.mask = mask;
			this.drill = drill;
			this.name = name;
			this.num = num;
			this.flags = parseFlags(Pin._defaultFlags, flags);
	
		};
	
		Pin._defaultFlags = {
			square: false
		};
	
		Pin.prototype._createCache = function(){
	
			this._cache = {};
	
			this._cache.x = this.x;
			this._cache.y = this.y;
			if(this.parent){
				this._cache.x += this.parent.mx;
				this._cache.y += this.parent.my;
			}
			this._cache.rx = this._cache.x - (this.thick / 2);
			this._cache.ry = this._cache.y - (this.thick / 2);
	
		}
	
		Pin.prototype.render = function(ctx, color) {
	
			if(!this._cache) this._createCache();
	
			if(color == '#FFFFFF')
				return;
	
			ctx.beginPath();
			if(this.flags.square)
				ctx.rect(this._cache.rx, this._cache.ry, this.thick, this.thick);
			else
				ctx.arc(this._cache.x, this._cache.y, this.thick / 2, 0, Math.PI * 2, true);
	
			ctx.closePath();
			ctx.fillStyle = '#4D4D4D'; // TODO: global color
			ctx.fill();
	
			ctx.beginPath();
			ctx.arc(this._cache.x, this._cache.y, this.drill / 2, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fillStyle = '#E5E5E5'; // TODO: set colors to global option
			ctx.fill();
	
		};
	
		Pin.prototype.clear = function(ctx){
	
			if(!this._cache) this._createCache();
	
			ctx.beginPath();
			ctx.arc(this._cache.x, this._cache.y, (this.clearance + this.thick) / 2.0, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
	
		};
	
		Pin.prototype.renderGL = function(gl, shaderProgram){
			
			gl.uniform1f(shaderProgram.roundPointsUniform, !this.flags.square);
	
			gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.pointBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
			gl.uniform1f(shaderProgram.innerRadiusUniform, 0.0);
	
			gl.uniform4f(shaderProgram.vColorUniform, 0.35, 0.35, 0.35, 1.0);
			gl.uniform1f(shaderProgram.pointsizeUniform, this.thick * gl.scaleFactor);
			gl.drawArrays(gl.POINTS, 0, this.pointBuffer.numItems);
	
			gl.uniform1f(shaderProgram.roundPointsUniform, true);
			gl.uniform4f(shaderProgram.vColorUniform, 0.74, 0.74, 0.74, 1.0);
			gl.uniform1f(shaderProgram.pointsizeUniform, this.drill * gl.scaleFactor);
			gl.drawArrays(gl.POINTS, 0, this.pointBuffer.numItems);
	
			gl.uniform1f(shaderProgram.roundPointsUniform, false);
	
		}
	
		Pin.prototype.clearGL = function(gl, shaderProgram){
	
			gl.uniform1f(shaderProgram.roundPointsUniform, !this.flags.square);
	
			gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.pointBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
			gl.uniform1f(shaderProgram.innerRadiusUniform, 0.0);
			gl.uniform1f(shaderProgram.pointsizeUniform, (this.thick + this.clearance) * gl.scaleFactor);
			gl.drawArrays(gl.POINTS, 0, this.pointBuffer.numItems);
	
			gl.uniform1f(shaderProgram.roundPointsUniform, false);
	
		};
	
		Pin.prototype.cleanupGL = function(gl){
	
			if(this.pointBuffer){
				gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, 1, gl.STATIC_DRAW);
				gl.deleteBuffer(this.pointBuffer);
				this.pointBuffer = null;
			}
	
		}
	
		Pin.prototype.setup3DArrayBuffer = function(gl, x, y){
	
			var vBuffer;
			vBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([this.x + this.parent.mx,this.y + this.parent.my,0.0]), gl.STATIC_DRAW);
			vBuffer.itemSize = 3;
			vBuffer.numItems = 1;
			this.pointBuffer = vBuffer;
	
		}
	
		return Pin;

	}
);