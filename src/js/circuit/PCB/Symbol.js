define(function() {

	var Symbol = function(name, unk) {

		this.name = name;
		this.width = 0;
		this.lines = [];

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

	}

	Symbol.prototype.init3DArrays = function(gl){

		for(var l = 0; l < this.lines.length; l++)
			this.lines[l].setup3DArrayBuffer(gl);

	};

	return Symbol;

});