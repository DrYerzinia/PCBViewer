define(function() {

	var ElementLine = function(x1, y1, x2, y2, thick) {

		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.thick = thick;

	};

	ElementLine.prototype._createCache = function(){

		this._cache = {};

		this._cache.x1 = this.x1;
		this._cache.y1 = this.y1;
		this._cache.x2 = this.x2;
		this._cache.y2 = this.y2;
		if(this.parent){
			this._cache.x1 += this.parent.mx;
			this._cache.y1 += this.parent.my;
			this._cache.x2 += this.parent.mx;
			this._cache.y2 += this.parent.my;
		}

	};

	ElementLine.prototype._prepareRender = function(ctx, thick){

		if(!this._cache) this._createCache();

		ctx.lineCap = 'round';
		ctx.lineWidth = thick;

		ctx.beginPath();
		ctx.moveTo(this._cache.x1, this._cache.y1);
		ctx.lineTo(this._cache.x2, this._cache.y2);

	};

	ElementLine.prototype.render = function(ctx, color) {

		ctx.strokeStyle = color;
		this._prepareRender(ctx, this.thick, color);
		ctx.stroke();
		ctx.closePath();

	};

	ElementLine.prototype.clear = function(ctx){};

	ElementLine.prototype.renderGL = function(gl, shaderProgram){

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexBuffer.numItems);

		gl.uniform1f(shaderProgram.innerRadiusUniform, 0.0);

		gl.uniform1f(shaderProgram.pointsizeUniform, this.thick*gl.scaleFactor);
		gl.uniform1f(shaderProgram.roundPointsUniform, true);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.pointBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.POINTS, 0, this.pointBuffer.numItems);
		gl.uniform1f(shaderProgram.roundPointsUniform, false);

	};

	ElementLine.prototype.clearGL = function(gl, shaderProgram){};

	ElementLine.prototype.cleanupGL = function(gl){

		if(this.vertexBuffer){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, 1, gl.STATIC_DRAW);
			gl.deleteBuffer(this.vertexBuffer);
			this.vertexBuffer = null;
		}

		if(this.pointBuffer){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, 1, gl.STATIC_DRAW);
			gl.deleteBuffer(this.pointBuffer);
			this.pointBuffer = null;
		}

	};

	ElementLine.prototype.generateLineBuffer = function(gl, thickness){

		var vBuffer, ox1, oy1, ox2, oy2, x1, x2, x3, x4, y1, y2, y3, y4;

		ox1 = this.x1;
		oy1 = this.y1;
		ox2 = this.x2;
		oy2 = this.y2;

		vBuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

		var rise = oy2 - oy1;
		var run = ox2 - ox1;
		var magnitude = Math.sqrt(rise * rise + run * run);

		var xshift = rise / magnitude * (thickness / 2);
		var yshift = run / magnitude * (thickness / 2);

		if(this.parent){
			ox1 += this.parent.mx;
			oy1 += this.parent.my;
			ox2 += this.parent.mx;
			oy2 += this.parent.my;
		}

		x1 = ox1 - xshift;
		y1 = oy1 + yshift;
		x2 = ox1 + xshift;
		y2 = oy1 - yshift;
		x3 = ox2 - xshift;
		y3 = oy2 + yshift;
		x4 = ox2 + xshift;
		y4 = oy2 - yshift;

		vertices = [
		 x1, y1,  0.0,
		 x2, y2,  0.0,
		 x3, y3,  0.0,
		 x4, y4,  0.0
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		vBuffer.itemSize = 3;
		vBuffer.numItems = 4;

		return vBuffer;

	};

	ElementLine.prototype.setupGL = function(gl, x, y){

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

		vBuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ox1,oy1,0.0,ox2,oy2,0.0]), gl.STATIC_DRAW);
		vBuffer.itemSize = 3;
		vBuffer.numItems = 2;
		this.pointBuffer = vBuffer;

	};

	return ElementLine;

});