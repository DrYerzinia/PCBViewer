define(function() {

	// Pad [x1 y1 x2 y2 thickness clearance mask name pad_number flags]
	var Pad = function(x1, y1, x2, y2, thick, clear, mask, name, pnum, flags) {

		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.thick = thick;
		this.clear = clear;
		this.mask = mask;
		this.name = name;
		this.pnum = pnum;
		this.flags = flags;

	};

	Pad.prototype.render = function(ctx, color) {

		if (color == '#FFFFFF')
			ctx.fillStyle = color;
		else
			ctx.fillStyle = '#4D4D4D'; // TODO: global color

		ctx.fillRect(
			this.x1 - (this.thick / 2),
			this.y1 - (this.thick / 2),
			this.x2 - this.x1 + (this.thick),
			this.y2 - this.y1 + (this.thick));

	};

	Pad.prototype.renderGL = function(gl, shaderProgram){

		gl.uniform4f(shaderProgram.vColorUniform, 0.35, 0.35, 0.35, 1.0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexBuffer.numItems);

	}

	Pad.prototype.clearGL = function(gl, shaderProgram){

		gl.bindBuffer(gl.ARRAY_BUFFER, this.clearBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.clearBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.clearBuffer.numItems);

	};

	Pad.prototype.cleanupGL = function(gl){

		if(this.vertexBuffer){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, 1, gl.STATIC_DRAW);
			gl.deleteBuffer(this.vertexBuffer);
			this.vertexBuffer = null;
		}

	}

	Pad.prototype.generatePadBuffer = function(gl, thick){

		var vBuffer, vertices, x1, x2, y1, y2;

		vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

		x1 = this.parent.mx + this.x1 - (thick / 2);
		y1 = this.parent.my + this.y1 - (thick / 2);
		x2 = x1 + this.x2 - this.x1 + thick;
		y2 = y1 + this.y2 - this.y1 + thick;

		vertices = [
		 x2, y2,  0.0,
		 x1, y2,  0.0,
		 x2, y1,  0.0,
		 x1, y1,  0.0
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		vBuffer.itemSize = 3;
		vBuffer.numItems = 4;

		return vBuffer;

	}

	Pad.prototype.setup3DArrayBuffer = function(gl, x, y){

		this.vertexBuffer = this.generatePadBuffer(gl, this.thick);
		this.clearBuffer = this.generatePadBuffer(gl, this.thick + this.clear);

	};

	return Pad;

});