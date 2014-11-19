define(function(){

	var Layer = function(pcbv, number, name, parts){

		this.pcbv = pcbv;

		this.number = number;
		this.name = name;

		this.visible = true;

		if(parts) this.parts = parts;
		else this.parts = [];

	};

	Layer.SOLDER = 0;
	Layer.TOP = 1;

	Layer.prototype.addPart = function(part){

		this.parts.push(part);

	};

	Layer.prototype.render = function(ctx, color){

		if(!color) color = this.pcbv.getLayerColors()[this.number-1];

		for(var p = 0; p < this.parts.length; p++)
			this.parts[p].render(ctx, color);

	};

	Layer.prototype.renderGL = function(gl, shaderProgram, oMatrix, mvMatrix, color){

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

		gl.viewport(0, 0, this.framebuffer.width, this.framebuffer.height);
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.uniform4f(shaderProgram.vColorUniform, color.r, color.g, color.b, 1.0);

		var i;
		for(i = 0; i < this.parts.length; i++)
			this.parts[i].renderGL(gl, shaderProgram);

	}

	Layer.prototype.init3DArrays = function(gl){

		var i;
		for(i = 0; i < this.parts.length; i++)
			this.parts[i].setup3DArrayBuffer(gl, 0, 0);

	}

	Layer.prototype.setupFramebuffer = function(gl, width, height){

        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        this.framebuffer.width = width;
        this.framebuffer.height = height;

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.framebuffer.width, this.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        this.renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.framebuffer.width, this.framebuffer.height);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	}

	return Layer;

});