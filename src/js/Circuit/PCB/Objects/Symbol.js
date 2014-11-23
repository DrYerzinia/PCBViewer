define(function() {

	var Symbol = function(name, unk) {

		this.name = name;
		this.width = 0;
		this.lines = [];

	};

	Symbol.prototype.setSilkWidth = function(width){

		for(var l = 0; l < this.lines.length; l++)
			this.lines[l].setWidth(width);

	};

	Symbol.prototype.render = function(ctx, color) {

		for (var l = 0; l < this.lines.length; l++)
			this.lines[l].render(ctx, color);

	};

	Symbol.prototype.renderGL = function(gl, shaderProgram){

		for(var l = 0; l < this.lines.length; l++)
			this.lines[l].renderGL(gl, shaderProgram);

	};

	Symbol.prototype.cleanupGL = function(gl){

		for(var l = 0; l < this.lines.length; l++)
			this.lines[l].cleanupGL(gl);

	};

	Symbol.prototype.setupGL = function(gl){

		for(var l = 0; l < this.lines.length; l++)
			this.lines[l].setupGL(gl);

	};

	return Symbol;

});