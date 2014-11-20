define(
	[
	 	"../Layer",
	 	"Graphics/glMatrix",
	 	"Util/Exception/NotImplementedException"
	],
	function(
		Layer,
		glMatrix,
		NotImplementedException
	){

		var Renderer = function(ctx, canvas, symbols, layers, boardWidth, boardHeight){

			if(!layers) return;

			this.ctx = ctx;
			this.canvas = canvas;

			this.boardWidth = boardWidth;
			this.boardHeight = boardHeight;

			this.symbols = symbols;

			this.layers = [];

			this.topSilk = null;
			this.bottomSkil = null;

			this.top = null;
			this.solder = null;
			this.pins = null;

			this.otherLayers = [];

			for(var i = 0; i < layers.length; i++)
				this.addLayer(layers[i]);

		};

		Renderer.prototype.addLayer = function(layer){

			this.layers.push(layer);

			if(layer.name == "silk"){
				if(!this.topSilk) this.topSilk = layer;
				else this.bottomSilk = layer;
			}
			else if(layer.name == "top_component")
				this.top = layer;
			else if(layer.name == "solder_component")
				this.solder = layer;
			else if(layer.name == "pins")
				this.pins = layer;
			else
				this.otherLayers.push(layer);

		};

		Renderer.prototype.destroy = function(){throw new NotImplementedException("Renderer.destroy is virtual function");};
		Renderer.prototype.setup = function(){throw new NotImplementedException("Renderer.setup is virtual function");};
		Renderer.prototype.resize = function(){throw new NotImplementedException("Renderer.resize is virtual function");};
		Renderer.prototype.render = function( side, offsetX, offsetY, scaleFactor){throw new NotImplementedException("Renderer.render is virtual function");};

		return Renderer;

	}
);