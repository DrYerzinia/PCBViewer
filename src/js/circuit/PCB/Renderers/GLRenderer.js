define(
	[
	 	"./Renderer",
	 	"../Layer",
	 	"Graphics/glMatrix",
	 	"Graphics/GLHelper",
	 	"Util/Class",
	 	"text!shaders/2D.fs",
	 	"text!shaders/2D.vs",
	 	"text!shaders/Texture.fs",
	 	"text!shaders/Texture.vs"
	],
	function(
		Renderer,
		Layer,
		glMatrix,
		GLHelper,
		Class,
		FragmentShader2Dtxt,
		VertexShader2Dtxt,
		FragmentShaderTextxt,
		VertexShaderTextxt
	){

		var GLRenderer = function(ctx, canvas, symbols, layers, boardWidth, boardHeight){

			Renderer.call(this, ctx, canvas, symbols, layers, boardWidth, boardHeight);

		}

		Class.extend(Renderer, GLRenderer);

		GLRenderer.prototype._drawLayer = function(layer){
			if(layer && !layer.isEmpty()){
				this.ctx.bindTexture(this.ctx.TEXTURE_2D, layer.texture);
				this.ctx.drawElements(this.ctx.TRIANGLES, this.layerVertexIndexBuffer.numItems, this.ctx.UNSIGNED_SHORT, 0);
			}
		};

		GLRenderer.prototype.destroy = function(){

			var gl = this.ctx;

			for(i = 0; i < this.layers.length; i++)
				this.layers[i].cleanupGL(gl);
			for(i in this.symbols)
				this.symbols[i].cleanupGL(this.ctx);

			// Restore GL Defaults
			gl.disable(gl.BLEND);
			gl.useProgram(null);
			gl.blendFunc(gl.ONE, gl.ZERO);
			gl.clearColor(0, 0, 0, 0);

			// Unbind all buffers
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.bindRenderbuffer(gl.RENDERBUFFER, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			// Clear viewport
			gl.viewport(0, 0, gl.viewportWidth, gl.viewportheight);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			// Clear errors
			while(gl.getError());

		};

		GLRenderer.prototype.setup = function(){

			var i, gl = this.ctx;

			// 2D Shader
			this.shaderProgram = GLHelper.createProgram(gl, 
					GLHelper.createShader(gl, gl.VERTEX_SHADER, VertexShader2Dtxt),
					GLHelper.createShader(gl, gl.FRAGMENT_SHADER, FragmentShader2Dtxt));

			this.shaderProgram.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
	        gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

	        this.shaderProgram.pMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
	        this.shaderProgram.mvMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
	        this.shaderProgram.vColorUniform = gl.getUniformLocation(this.shaderProgram, "vColor");

	        this.shaderProgram.pointsizeUniform = gl.getUniformLocation(this.shaderProgram, "pointsize");
	        this.shaderProgram.innerRadiusUniform = gl.getUniformLocation(this.shaderProgram, "innerRadius");
	        this.shaderProgram.roundPointsUniform = gl.getUniformLocation(this.shaderProgram, "roundPoints");
	        this.shaderProgram.startAngleUniform = gl.getUniformLocation(this.shaderProgram, "startAngle");
	        this.shaderProgram.sweepUniform = gl.getUniformLocation(this.shaderProgram, "sweep");
	        this.shaderProgram.arcEnabledUniform = gl.getUniformLocation(this.shaderProgram, "arcEnabled");
	        this.shaderProgram.invertedUniform = gl.getUniformLocation(this.shaderProgram, "inverted");
	        this.shaderProgram.shaveInsideUniform = gl.getUniformLocation(this.shaderProgram, "shaveInside");
	        this.shaderProgram.shaveFFUniform = gl.getUniformLocation(this.shaderProgram, "shaveFF");

	        // Texture Shader
			this.texShaderProgram = GLHelper.createProgram(gl, 
					GLHelper.createShader(gl, gl.VERTEX_SHADER, VertexShaderTextxt),
					GLHelper.createShader(gl, gl.FRAGMENT_SHADER, FragmentShaderTextxt));

	        this.texShaderProgram.vertexPositionAttribute = gl.getAttribLocation(this.texShaderProgram, "aVertexPosition");
	        gl.enableVertexAttribArray(this.texShaderProgram.vertexPositionAttribute);

	        this.texShaderProgram.textureCoordAttribute = gl.getAttribLocation(this.texShaderProgram, "aTextureCoord");
	        gl.enableVertexAttribArray(this.texShaderProgram.textureCoordAttribute);

	        this.texShaderProgram.pMatrixUniform = gl.getUniformLocation(this.texShaderProgram, "uPMatrix");
	        this.texShaderProgram.mvMatrixUniform = gl.getUniformLocation(this.texShaderProgram, "uMVMatrix");
	        this.texShaderProgram.samplerUniform = gl.getUniformLocation(this.texShaderProgram, "uSampler");

	        // Board Polygon
			this.boardVertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.boardVertexBuffer);
			vertices = [
			 this.boardWidth, this.boardHeight,  -1.0,
			  -1.0, this.boardHeight,  -1.0,
			  this.boardWidth,   -1.0,  -1.0,
			  -1.0,   -1.0,  -1.0
			];
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
			this.boardVertexBuffer.itemSize = 3;
			this.boardVertexBuffer.numItems = 4;

			// Layer Polygon
			this.layerVertexPositionBuffer = gl.createBuffer();
		    gl.bindBuffer(gl.ARRAY_BUFFER, this.layerVertexPositionBuffer);
		    vertices = [
		     -1.0, -1.0,  1.0,
		      1.0, -1.0,  1.0,
		      1.0,  1.0,  1.0,
		     -1.0,  1.0,  1.0,
		    ];
		    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		    this.layerVertexPositionBuffer.itemSize = 3;
		    this.layerVertexPositionBuffer.numItems = 4;

		    // Layer Texture Coordinates
		    this.layerVertexTextureCoordBuffer = gl.createBuffer();
		    gl.bindBuffer(gl.ARRAY_BUFFER, this.layerVertexTextureCoordBuffer);
		    var textureCoords = [
		      0.0, 0.0,
		      1.0, 0.0,
		      1.0, 1.0,
		      0.0, 1.0,
		    ];
		    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
		    this.layerVertexTextureCoordBuffer.itemSize = 2;
		    this.layerVertexTextureCoordBuffer.numItems = 4;

		    // Layer Vertex Indice Buffer
		    this.layerVertexIndexBuffer = gl.createBuffer();
		    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.layerVertexIndexBuffer);
		    var cubeVertexIndices = [
		        0, 1, 2,      0, 2, 3
		    ];
		    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
		    this.layerVertexIndexBuffer.itemSize = 1;
		    this.layerVertexIndexBuffer.numItems = 6;

	        // Viewport setup
			gl.viewportWidth = this.canvas.width;
			gl.viewportHeight = this.canvas.height;

			// GL Setup
	        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		    // Set-Up Frame Buffers
			for(i = 0; i < this.layers.length; i++)
				this.layers[i].setupFramebuffer(gl);

			// Set-Up 3D Buffer Arrays
			for(i = 0; i < this.layers.length; i++)
				this.layers[i].init3DArrays(gl);
			for(i in this.symbols)
				this.symbols[i].init3DArrays(this.ctx);
		}

		GLRenderer.prototype.resize = function(){

			this.ctx.viewportWidth = this.canvas.width;
			this.ctx.viewportHeight = this.canvas.height;

			for(var i = 0; i < this.layers.length; i++){
				this.layers[i].resizeFrameBuffer(this.ctx);
			}

		}

		GLRenderer.prototype.render = function(side, offsetX, offsetY, scaleFactor){
			
			var oMatrix, mvMatrix, i, r, g, b, l, color, gl = this.ctx;

			oMatrix = glMatrix.mat4.create();
			mvMatrix = glMatrix.mat4.create();

			gl.scaleFactor = scaleFactor;
			gl.oMatrix = oMatrix;
			gl.mvMatrix = mvMatrix;
			gl.side = side;

			glMatrix.mat4.ortho(0, gl.viewportWidth, gl.viewportHeight, 0, -10, 10, oMatrix);

			glMatrix.mat4.identity(mvMatrix);

			if(side == Layer.TOP){
				glMatrix.mat4.scale(mvMatrix, [1.0, -1.0, 1.0]);
				glMatrix.mat4.translate(mvMatrix, [0.0, -gl.viewportHeight, 0.0]);
			}

			glMatrix.mat4.scale(mvMatrix, [scaleFactor, scaleFactor, 1.0]);
			glMatrix.mat4.translate(mvMatrix, [-offsetX, -offsetY, 0.0]);

	        gl.disableVertexAttribArray(this.texShaderProgram.textureCoordAttribute);
	        gl.disable(gl.BLEND);

	        gl.useProgram(this.shaderProgram);

			gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, oMatrix);
	        gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, mvMatrix);

			if(side == Layer.TOP){

				this.topSilk.renderGL(gl, this.shaderProgram, {r: 0.0, g: 0.0, b: 0.0}, this.pins, null);
				this.bottomSilk.renderGL(gl, this.shaderProgram, {r: 1.0, g: 1.0, b: 1.0}, this.pins, null);

				this.top.renderGL(gl, this.shaderProgram, {r: 1.0, g: 1.0, b: 1.0}, this.pins, null);
				this.solder.renderGL(gl, this.shaderProgram, {r: 0.35, g: 0.35, b: 0.35}, this.pins, null);

			} else {

				this.topSilk.renderGL(gl, this.shaderProgram, {r: 1.0, g: 1.0, b: 1.0}, this.pins, null);
				this.bottomSilk.renderGL(gl, this.shaderProgram,{r: 0.0, g: 0.0, b: 0.0}, this.pins, null);

				this.top.renderGL(gl, this.shaderProgram, {r: 0.35, g: 0.35, b: 0.35}, this.pins, null);
				this.solder.renderGL(gl, this.shaderProgram, {r: 1.0, g: 1.0, b: 1.0}, this.pins, null);

			}

			this.pins.renderGL(gl, this.shaderProgram, {r: 1.0, g: 1.0, b: 1.0}, null);

			for(l = 0; l < this.otherLayers.length; l++){

				color = this.otherLayers[l].pcbv.getLayerColors()[l];

				r = parseInt(color.substring(1, 3), 16) / 256;
				g = parseInt(color.substring(3, 5), 16) / 256;
				b = parseInt(color.substring(5, 7), 16) / 256;

				if(this.otherLayers[l].name == "bottom")
					this.otherLayers[l].renderGL(gl, this.shaderProgram, {r: r, g: g, b: b}, this.pins, this.solder);
				else if(this.otherLayers[l].name == "top")
					this.otherLayers[l].renderGL(gl, this.shaderProgram, {r: r, g: g, b: b}, this.pins, this.top);
				else
					this.otherLayers[l].renderGL(gl, this.shaderProgram, {r: r, g: g, b: b}, this.pins, null);

			}

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			// Draw Board
			gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
			gl.clearColor(0.79, 0.79, 0.79, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.uniform4f(this.shaderProgram.vColorUniform, 0.89, 0.89, 0.89, 1.0);

			gl.bindBuffer(gl.ARRAY_BUFFER, this.boardVertexBuffer);
			gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.boardVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.boardVertexBuffer.numItems);

			// Setup texture program
	        gl.useProgram(this.texShaderProgram);

			glMatrix.mat4.ortho(-1, 1, -1, 1, -1, 1, oMatrix);
			glMatrix.mat4.identity(mvMatrix);

			gl.uniformMatrix4fv(this.texShaderProgram.pMatrixUniform, false, oMatrix);
	        gl.uniformMatrix4fv(this.texShaderProgram.mvMatrixUniform, false, mvMatrix);

	        gl.enableVertexAttribArray(this.texShaderProgram.textureCoordAttribute);

	        gl.enable(gl.BLEND);

	        // Draw Layers
	        gl.bindBuffer(gl.ARRAY_BUFFER, this.layerVertexPositionBuffer);
	        gl.vertexAttribPointer(this.texShaderProgram.vertexPositionAttribute, this.layerVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	        gl.bindBuffer(gl.ARRAY_BUFFER, this.layerVertexTextureCoordBuffer);
	        gl.vertexAttribPointer(this.texShaderProgram.textureCoordAttribute, this.layerVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	        gl.activeTexture(gl.TEXTURE0);
	        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.layerVertexIndexBuffer);

	        if(side != Layer.TOP){

	        	this._drawLayer(this.topSilk);
	        	this._drawLayer(this.solder);
	        	for(l = this.otherLayers.length - 1; l >= 0; l--)
		        	this._drawLayer(this.otherLayers[l]);
	        	this._drawLayer(this.top);
	        	this._drawLayer(this.pins);
	        	this._drawLayer(this.bottomSilk);

	        } else {

	        	this._drawLayer(this.bottomSilk);
	        	this._drawLayer(this.top);
	        	for(l = 0; l < this.otherLayers.length; l++)
		        	this._drawLayer(this.otherLayers[l]);
	        	this._drawLayer(this.solder);
	        	this._drawLayer(this.pins);
	        	this._drawLayer(this.topSilk);

	        }


		}

		return GLRenderer;

	}
);