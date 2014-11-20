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

		TwoDRenderer._renderLayer = function(ctx, bufferCtx, bufferCanvas, layer, color, pins, components){

			if(layer && !layer.isEmpty()){
				bufferCtx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);
				layer.render(bufferCtx, color);
				ctx.drawImage(bufferCanvas, 0, 0);
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

	        	TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.topSilk, '#FFFFFF', null, null);
	        	TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.solder, '#FFFFFF', null, null);
	        	for(l = this.otherLayers.length - 1; l >= 0; l--)
					TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.otherLayers[l], null, null, null);
	        	TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.top, '#000000', null, null);
	        	TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.pins, null, null, null);
	        	TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.bottomSilk, '#000000', null, null);

	        } else {

	        	TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.bottomSilk, '#FFFFFF', null, null);
	        	TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.top, '#FFFFFF', null, null);
	        	for(l = 0; l < this.otherLayers.length; l++)
					TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.otherLayers[l], null, null, null);
	        	TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.solder, '#000000', null, null);
	        	TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.pins, null, null, null);
	        	TwoDRenderer._renderLayer(this.ctx, this.bufferCtx, this.bufferCanvas, this.topSilk, '#000000', null, null);

	        }
		
			// Restore default transform
			this.bufferCtx.restore();

		};

		return TwoDRenderer;

	}
);