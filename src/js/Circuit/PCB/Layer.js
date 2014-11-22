define(
	[
	 	"./Objects/Polygon"
	],
	function(
		Polygon
	){

		var Layer = function(pcbv, number, name, parts){
	
			this.pcbv = pcbv;
	
			this.number = number;
			this.name = name;
	
			this.visible = true;
	
			if(parts) this.parts = parts;
			else this.parts = [];

			this.polygons = [];
	
		};
	
		Layer.SOLDER = 0;
		Layer.TOP = 1;

		Layer.prototype._renderPolygons = function(ctx, color, pins, elements){

			var clearing = false;

			// render clear polygons first
			for(i = 0; i < this.polygons.length; i++)
				if(this.polygons[i].isClear()){
					this.polygons[i].render(ctx, color);
					clearing = true;
				}

			// clear pins, same layer pads, and other clearing objects
			if(clearing){
				ctx.globalCompositeOperation = "destination-out";
				ctx.strokeStyle = 'rgba(0,0,0,1)';
				ctx.fillStyle = 'rgba(0,0,0,1)';
				for(i = 0; i < this.parts.length; i++)
						this.parts[i].clear(ctx);
				if(elements)
					for(i = 0; i < elements.parts.length; i++)
						elements.parts[i].clear(ctx);
				if(pins)
					for(i = 0; i < pins.parts.length; i++)
						pins.parts[i].clear(ctx, this.number);
				ctx.globalCompositeOperation = "source-over";

			}

			// Render non clearing polygons
			for(i = 0; i < this.polygons.length; i++)
				if(!this.polygons[i].isClear())
					this.polygons[i].render(ctx, color);

			// Clear centers
			ctx.globalCompositeOperation = "destination-out";
			ctx.strokeStyle = 'rgba(0,0,0,1)';
			ctx.fillStyle = 'rgba(0,0,0,1)';
			if(pins)
				for(i = 0; i < pins.parts.length; i++)
					pins.parts[i].clearInner(ctx);
			ctx.globalCompositeOperation = "source-over";

		}

		Layer.prototype._renderPolygonsGL = function(gl, shaderProgram, color, pins, elements){

			var clearing = false;

			// render clear polygons first
			gl.uniform4f(shaderProgram.vColorUniform, color.r, color.g, color.b, 1.0);
			for(i = 0; i < this.polygons.length; i++)
				if(this.polygons[i].isClear()){
					this.polygons[i].renderGL(gl, shaderProgram);
					clearing = true;
				}

			// render alpha of pins, same layer pads, and other clearing objects
			// Pins and vias clear specially if they have thermals
			if(clearing){
				gl.uniform4f(shaderProgram.vColorUniform, 0.0, 0.0, 0.0, 0.0);
				for(i = 0; i < this.parts.length; i++)
					this.parts[i].clearGL(gl, shaderProgram);
				if(elements)
					for(i = 0; i < elements.parts.length; i++)
						elements.parts[i].clearGL(gl, shaderProgram);
				if(pins)
					for(i = 0; i < pins.parts.length; i++)
						pins.parts[i].clearGL(gl, shaderProgram, this.number);
			}

			// render non clear polygons
			gl.uniform4f(shaderProgram.vColorUniform, color.r, color.g, color.b, 1.0);
			for(i = 0; i < this.polygons.length; i++)
				if(!this.polygons[i].isClear())
					this.polygons[i].renderGL(gl, shaderProgram);

			// Clear centers
			gl.uniform4f(shaderProgram.vColorUniform, 0.0, 0.0, 0.0, 0.0);
			if(pins)
				for(i = 0; i < pins.parts.length; i++)
					pins.parts[i].clearInnerGL(gl, shaderProgram);

		}

		Layer.prototype.isEmpty = function(){
			return this.parts.length == 0 && this.polygons.length == 0;
		}

		Layer.prototype.hasPolygons = function(){
			return this.polygons.length != 0;
		};

		Layer.prototype.addPart = function(part){
			this.parts.push(part);
		};

		Layer.prototype.seperatePolygons = function(){
			for(var i = 0; i < this.parts.length;)
				if(this.parts[i] instanceof Polygon)
					this.polygons.push(this.parts.splice(i, 1)[0]);
				else i++;

		};

		Layer.prototype.render = function(ctx, color, pins, elements, top){

			if(!color) color = this.pcbv.getLayerColors()[this.number-1];

			if(this.hasPolygons()) this._renderPolygons(ctx, color, pins, elements);
			for(var i = 0; i < this.parts.length; i++)
				this.parts[i].render(ctx, color, top);

		};
	
		Layer.prototype.renderGL = function(gl, shaderProgram, color, pins, elements, top){
	
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

			gl.viewport(0, 0, this.framebuffer.width, this.framebuffer.height);
			gl.clearColor(0.0, 0.0, 0.0, 0.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
			if(this.hasPolygons()) this._renderPolygonsGL(gl, shaderProgram, color, pins, elements);
			gl.uniform4f(shaderProgram.vColorUniform, color.r, color.g, color.b, 1.0);
			for(var i = 0; i < this.parts.length; i++)
				this.parts[i].renderGL(gl, shaderProgram, top);

		}
	
		Layer.prototype.cleanupGL = function(gl){
	
			var i;
			for(i = 0; i < this.parts.length; i++)
				this.parts[i].cleanupGL(gl);
	
			gl.deleteTexture(this.texture);
			gl.deleteRenderbuffer(this.renderbuffer);
			gl.deleteFramebuffer(this.framebuffer);
	
		}
	
		Layer.prototype.setupGL = function(gl){

			var i;

			this.setupFramebuffer(gl);
			for(i = 0; i < this.parts.length; i++)
				this.parts[i].setupGL(gl, 0, 0);
			for(i = 0; i < this.polygons.length; i++)
				this.polygons[i].setupGL(gl, 0, 0);

		}
	
		Layer.prototype.resizeFrameBuffer = function(gl){
	
	        this.framebuffer.width = gl.viewportWidth;
	        this.framebuffer.height = gl.viewportHeight;
	
	        gl.bindTexture(gl.TEXTURE_2D, this.texture);
	        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.framebuffer.width, this.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	        gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
	        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.framebuffer.width, this.framebuffer.height);
	
		}
	
		Layer.prototype.setupFramebuffer = function(gl){
	
	        this.framebuffer = gl.createFramebuffer();
	        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	        this.framebuffer.width = gl.viewportWidth;
	        this.framebuffer.height = gl.viewportHeight;
	
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

	}
);