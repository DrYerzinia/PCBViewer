define(
	[
	 	"./Layer",
	 	"Graphics/glMatrix"
	],
	function(
		Layer,
		glMatrix
	){

		var LayerManager = function(layers){

			var l, layer;

			this.layers = layers;

			this.topSilk = null;
			this.bottomSkil = null;

			this.top = null;
			this.solder = null;
			this.pins = null;

			this.otherLayers = [];

			for(l = 0; l < layers.length; l++){

				layer = layers[l];

				if(layer.name == "silk"){
					if(!this.topSilk) this.topSilk = layer;
					else this.bottomSilk = layer;
				}
				else {
					this.otherLayers.push(layer);
				}

			}

		}

		LayerManager.prototype.setupGL = function(gl, width, height){

			this.height = height;

			this.boardVertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.boardVertexBuffer);
			vertices = [
			 width, height,  -1.0,
			  -1.0, height,  -1.0,
			 width,   -1.0,  -1.0,
			  -1.0,   -1.0,  -1.0
			];
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
			this.boardVertexBuffer.itemSize = 3;
			this.boardVertexBuffer.numItems = 4;
			
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

		    this.layerVertexIndexBuffer = gl.createBuffer();
	        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.layerVertexIndexBuffer);
	        var cubeVertexIndices = [
	            0, 1, 2,      0, 2, 3
	        ];
	        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
	        this.layerVertexIndexBuffer.itemSize = 1;
	        this.layerVertexIndexBuffer.numItems = 6;

		}

		LayerManager.prototype.renderGL = function(gl, shaderProgram, textureShaderProgram, side, offsetX, offsetY, scaleFactor){
			
			var oMatrix, mvMatrix, i, r, g, b, l, color;

			oMatrix = glMatrix.mat4.create();
			mvMatrix = glMatrix.mat4.create();

			gl.scaleFactor = scaleFactor;
			gl.oMatrix = oMatrix;
			gl.mvMatrix = mvMatrix;
			gl.side = side;

			glMatrix.mat4.ortho(0, gl.viewportWidth, gl.viewportHeight, 0, -10, 10, oMatrix);

			glMatrix.mat4.identity(mvMatrix);

			if(side == Layer.TOP){
				glMatrix.mat4.translate(mvMatrix, [0.0, this.height * scaleFactor, 0.0]);
				glMatrix.mat4.scale(mvMatrix, [1.0, -1.0, 1.0]);
			}

			glMatrix.mat4.scale(mvMatrix, [scaleFactor, scaleFactor, 1.0]);
			glMatrix.mat4.translate(mvMatrix, [-offsetX, -offsetY, 0.0]);

	        gl.disableVertexAttribArray(textureShaderProgram.textureCoordAttribute);
	        gl.disable(gl.BLEND);

	        gl.useProgram(shaderProgram);

			gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, oMatrix);
	        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

			if(side == Layer.TOP){

				this.topSilk.renderGL(gl, shaderProgram, oMatrix, mvMatrix, {r: 0.0, g: 0.0, b: 0.0});
				this.bottomSilk.renderGL(gl, shaderProgram, oMatrix, mvMatrix, {r: 1.0, g: 1.0, b: 1.0});

				this.top.renderGL(gl, shaderProgram, oMatrix, mvMatrix, {r: 1.0, g: 1.0, b: 1.0});
				this.solder.renderGL(gl, shaderProgram, oMatrix, mvMatrix, {r: 0.0, g: 0.0, b: 0.0});

			} else {

				this.topSilk.renderGL(gl, shaderProgram, oMatrix, mvMatrix, {r: 1.0, g: 1.0, b: 1.0});
				this.bottomSilk.renderGL(gl, shaderProgram, oMatrix, mvMatrix, {r: 0.0, g: 0.0, b: 0.0});

				this.top.renderGL(gl, shaderProgram, oMatrix, mvMatrix, {r: 0.0, g: 0.0, b: 0.0});
				this.solder.renderGL(gl, shaderProgram, oMatrix, mvMatrix, {r: 1.0, g: 1.0, b: 1.0});

			}

			this.pins.renderGL(gl, shaderProgram, oMatrix, mvMatrix, {r: 1.0, g: 1.0, b: 1.0});

			for(l = 0; l < this.otherLayers.length; l++){

				color = this.otherLayers[l].pcbv.getLayerColors()[l];

				r = parseInt(color.substring(1, 3), 16) / 256;
				g = parseInt(color.substring(3, 5), 16) / 256;
				b = parseInt(color.substring(5, 7), 16) / 256;

				this.otherLayers[l].renderGL(gl, shaderProgram, oMatrix, mvMatrix, {r: r, g: g, b: b});

			}

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			// Draw Board
			gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
			gl.clearColor(0.79, 0.79, 0.79, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.uniform4f(shaderProgram.vColorUniform, 0.89, 0.89, 0.89, 1.0);

			gl.bindBuffer(gl.ARRAY_BUFFER, this.boardVertexBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.boardVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.boardVertexBuffer.numItems);

			// Setup texture program
	        gl.useProgram(textureShaderProgram);

			glMatrix.mat4.ortho(-1, 1, -1, 1, -1, 1, oMatrix);
			glMatrix.mat4.identity(mvMatrix);

			gl.uniformMatrix4fv(textureShaderProgram.pMatrixUniform, false, oMatrix);
	        gl.uniformMatrix4fv(textureShaderProgram.mvMatrixUniform, false, mvMatrix);

	        gl.enableVertexAttribArray(textureShaderProgram.textureCoordAttribute);

	        gl.enable(gl.BLEND);

	        // Draw Layer
	        gl.bindBuffer(gl.ARRAY_BUFFER, this.layerVertexPositionBuffer);
	        gl.vertexAttribPointer(textureShaderProgram.vertexPositionAttribute, this.layerVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	        gl.bindBuffer(gl.ARRAY_BUFFER, this.layerVertexTextureCoordBuffer);
	        gl.vertexAttribPointer(textureShaderProgram.textureCoordAttribute, this.layerVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	        gl.activeTexture(gl.TEXTURE0);
	        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.layerVertexIndexBuffer);

	        if(side != Layer.TOP){

	        	gl.bindTexture(gl.TEXTURE_2D, this.topSilk.texture);
	        	gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	        	gl.bindTexture(gl.TEXTURE_2D, this.solder.texture);
	        	gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	        	for(l = this.otherLayers.length - 1; l >= 0; l--){

					if(this.otherLayers[l].parts.length != 0){
						gl.bindTexture(gl.TEXTURE_2D, this.otherLayers[l].texture);
						gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
					}

				}

				gl.bindTexture(gl.TEXTURE_2D, this.top.texture);
	        	gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	        	gl.bindTexture(gl.TEXTURE_2D, this.pins.texture);
	        	gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	        	gl.bindTexture(gl.TEXTURE_2D, this.bottomSilk.texture);
	        	gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	        } else {

	        	gl.bindTexture(gl.TEXTURE_2D, this.bottomSilk.texture);
	        	gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

				gl.bindTexture(gl.TEXTURE_2D, this.top.texture);
	        	gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	        	for(l = 0; l < this.otherLayers.length; l++){

					if(this.otherLayers[l].parts.length != 0){
						gl.bindTexture(gl.TEXTURE_2D, this.otherLayers[l].texture);
						gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
					}

				}

	        	gl.bindTexture(gl.TEXTURE_2D, this.solder.texture);
	        	gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	        	gl.bindTexture(gl.TEXTURE_2D, this.pins.texture);
	        	gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	        	gl.bindTexture(gl.TEXTURE_2D, this.topSilk.texture);
	        	gl.drawElements(gl.TRIANGLES, this.layerVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	        }


		}

		LayerManager.prototype.init3DArrays = function(gl){

			var l;
			for(l in this.layers)
				this.layers[l].init3DArrays(gl);

		}

		LayerManager.prototype.setupFramebuffers = function(gl, width, height){

			var l;
			for(l in this.layers)
				this.layers[l].setupFramebuffer(gl, width, height);

		}

		return LayerManager;

	}
);