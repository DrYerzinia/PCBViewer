define(
	[
	 	"./Renderer",
	 	"../Layer",
	 	"Util/Class"
	],
	function(
		Renderer,
		Layer,
		Class
	){

		var TwoDRenderer = function(ctx, canvas, symbols, layers, boardWidth, boardHeight){

			Renderer.call(this, ctx, canvas, symbols, layers, boardWidth, boardHeight);

		};

		Class.extend(Renderer, TwoDRenderer);

		TwoDRenderer.prototype._renderLayer = function(layer, color){

			var components = null;

			if(layer && !layer.isEmpty()){

				if(layer.name == "bottom") components = this.solder;
				else if(layer.name == "top") components = this.top;

				// Clear Buffer, have to reset transform for this
				this.bufferCtx.save();
				this.bufferCtx.setTransform(1,0,0,1,0,0);
				this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
				this.bufferCtx.restore();

				layer.render(this.bufferCtx, color, this.pins, components);

				this.ctx.drawImage(this.bufferCanvas, 0, 0);

			}

		};

		TwoDRenderer.prototype.destroy = function(){};

		TwoDRenderer.prototype.setup = function(){

			this.bufferCanvas = document.createElement('canvas');
			this.bufferCanvas.width = this.canvas.width;
			this.bufferCanvas.height = this.canvas.height;
	
			this.bufferCtx = this.bufferCanvas.getContext('2d');

		};

		TwoDRenderer.prototype.resize = function(){

			this.bufferCanvas.width = this.canvas.width;
			this.bufferCanvas.height = this.canvas.height;

		}

		TwoDRenderer.prototype.render = function(side, offsetX, offsetY, scaleFactor){

			// Fill canvas background Dark Grey
			this.bufferCtx.fillStyle = '#CCCCCC';
			this.bufferCtx.fillRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

			// Save default transform
			this.bufferCtx.save();
		
			// Flip canvas if solder side
			if(side){
				this.bufferCtx.scale(1, -1);
				this.bufferCtx.translate(0, -this.bufferCanvas.height);
			}
		
			// Scale and shift
			this.bufferCtx.scale(scalef, scalef);
			this.bufferCtx.translate(-offsetX, -offsetY);	

			// Fill board space Grey
			this.bufferCtx.fillStyle = '#E5E5E5';
			this.bufferCtx.fillRect(0, 0, this.boardWidth, this.boardHeight);
			this.ctx.globalAlpha = 1.0;
			this.ctx.drawImage(this.bufferCanvas, 0, 0);

			// Draw Layers
			this.ctx.globalAlpha = 0.5;
			if(side != Layer.TOP){

	        	this._renderLayer(this.topSilk, '#FFFFFF', null);
	        	this._renderLayer(this.solder, '#FFFFFF', null);
	        	for(l = this.otherLayers.length - 1; l >= 0; l--)
	        		this._renderLayer(this.otherLayers[l], null, null);
	        	this._renderLayer(this.top, '#000000', null);
	        	this._renderLayer(this.pins, null, null);
	        	this._renderLayer(this.bottomSilk, '#000000', null);

	        } else {

	        	this._renderLayer(this.bottomSilk, '#FFFFFF', null);
	        	this._renderLayer(this.top, '#FFFFFF', null);
	        	for(l = 0; l < this.otherLayers.length; l++)
	        		this._renderLayer(this.otherLayers[l], null, null);
	        	this._renderLayer(this.solder, '#000000', null);
	        	this._renderLayer(this.pins, null, null);
	        	this._renderLayer(this.topSilk, '#000000', null);

	        }
		
			// Restore default transform
			this.bufferCtx.restore();

		};

		return TwoDRenderer;

	}
);