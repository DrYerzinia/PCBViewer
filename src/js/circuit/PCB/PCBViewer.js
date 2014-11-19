// PCBViewer.js
// Michael Marques / DrYerzinia / KD0WGV
// 09-10-2013
// r4
//
// This is a Viewer for PCB files from
// gEDA tools PCB software
//

define(
	[
	 	"./Line",
	 	"./Text",
	 	"./Layer",
	 	"./Via",
	 	"./Pin",
	 	"./Pad",
	 	"./Element",
	 	"./ElementLine",
	 	"./ElementArc",
	 	"./Symbol",
	 	"./LayerManager",
	 	"Graphics/glMatrix",
	 	"Graphics/GLHelper",
	 	"text!../../../data/shaders/2D.fs",
	 	"text!../../../data/shaders/2D.vs",
	 	"text!../../../data/shaders/Texture.fs",
	 	"text!../../../data/shaders/Texture.vs"
	],
	function(
		Line,
		Text,
		Layer,
		Via,
		Pin,
		Pad,
		Element,
		ElementLine,
		ElementArc,
		Symbol,
		LayerManager,
		glMatrix,
		GLHelper,
		FragmentShader2Dtxt,
		VertexShader2Dtxt,
		FragmentShaderTextxt,
		VertexShaderTextxt
	){

		function PCBV(canvas, attach, mode) {

			var gl;

			this._layerColors = PCBV._defaultLayerColors;

			this.vias = [];
			this.layers = [];
			this.elements = [];
			this.symbols = {};
			this.canvas = canvas;

			this.mode = "None";

			if(attach){

				if(mode == "Normal")
					this.ctx = false;
				else
					this.ctx = PCBV._getWebGL(canvas);

				if(this.ctx == false){

					this.mode = "Normal";
					this.ctx = canvas.getContext('2d');

					this.buffer_layer = document.createElement('canvas');
					this.buffer_layer.width = this.canvas.width;
					this.buffer_layer.height = this.canvas.height;
			
					this.buffer_ctx = this.buffer_layer.getContext('2d');

				} else {

					this.mode = "Accelerated";

					gl = this.ctx;

					gl.viewportWidth = canvas.width;
					gl.viewportHeight = canvas.height;

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

			        // Viewport setup
			        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

				}

				this.last_time = 0;
				this.end_time = 0;
		
				this.clicking = false;
			
				this.mouse_x = canvas.width/2;
				this.mouse_y = canvas.height/2;
		
				this.mouseUpFunction = function(t){return function(e){if(e.which == 1) t.clicking = false;};}(this);
				this.mouseDownFunction = function(t){return function(e){if(e.which == 1) t.clicking = true;};}(this)
				this.keyDownFunction = function(t){return function(e){t.update_key(e);};}(this);
				this.mouseMoveFunction = function(t){return function(e){
					if(t.clicking)
						t.update_mouse_drag(t.mouse_x-e.pageX, t.mouse_y-e.pageY);		
					t.mouse_x = e.pageX;
					t.mouse_y = e.pageY;
				};}(this);
				this.mouseWheelFunction = function(t){return function(e){t.wheel(e);};}(this);

				if(window.addEventListener){
					document.addEventListener("mouseup", this.mouseUpFunction, false);
					this.canvas.addEventListener("mousewheel", this.mouseWheelFunction, false);
					this.canvas.addEventListener('DOMMouseScroll', this.mouseWheelFunction, false);
				} else {
					document.attachEvent("mouseup", this.mouseUpFunction);
					this.canvas.attachEvent("onmousewheel", this.mouseWheelFunction);
				}
				canvas.onmousedown = this.mouseDownFunction;
				canvas.onkeydown = this.keyDownFunction;
				canvas.onmousemove = this.mouseMoveFunction;

			};

			console.log("Mode: " + this.mode);
		
		};

		PCBV.prototype.destroy = function(){

			var i;

			if(this.mode == "Accelerated"){

				var gl = this.ctx;

				for(i = 0; i < this.vias.length; i++)
					this.vias[i].cleanupGL(gl);
				for(i = 0; i < this.layers.length; i++)
					this.layers[i].cleanupGL(gl);
				for(i = 0; i < this.elements.length; i++)
					this.elements[i].cleanupGL(gl);
				for(i in this.symbols)
					this.symbols[i].cleanupGL(gl);

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

			} else {

				this.ctx = null;

			}

			if(window.addEventListener){
				document.removeEventListener("mouseup", this.mouseUpFunction, false);
				this.canvas.removeEventListener("mousewheel", this.mouseWheelFunction, false);
				this.canvas.removeEventListener('DOMMouseScroll', this.mouseWheelFunction, false);
			} else {
				document.detachEvent("mouseup", this.mouseUpFunction);
				this.canvas.detachEvent("onmousewheel", this.mouseWheelFunction);
			}
			this.canvas.onmousedown = null;
			this.canvas.onkeydown = null;
			this.canvas.onmousemove = null;

		}

		// TODO: maybe make this layer named based!
		PCBV._defaultLayerColors = ['#8B2323', '#3A5FCD', '#104E8B', '#CD3700',
				'#548B54', '#8B7355', '#00868B', '#228B22',
				'#000000', '#000000'];

		PCBV._getWebGL = function(canvas){

			var names, context, i;

			if(!!window.WebGLRenderingContext) {
				names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
				context = false;

				for(var i=0; i < names.length ;i++){
					try {
						context = canvas.getContext(names[i]);
						if(context && typeof context.getParameter == "function"){
							return context;
						}
					} catch(e) {}
				}
				return false;
			}
			return false;
		}

		PCBV.prototype.getLayerColors = function(){
			return this._layerColors;
		}

		PCBV.prototype.resize = function(){

			if(this.mode == "Normal"){

				this.buffer_layer.width = this.canvas.width;
				this.buffer_layer.height = this.canvas.height;

			} else {

				this.ctx.viewportWidth = this.canvas.width;
				this.ctx.viewportHeight = this.canvas.height;

				this.resized = true;

			}

		};
	
		PCBV.prototype.parse_data = function(data){
	
			var lines, l, splt, new_obj, sub_obj, xmi, xma;
	
			lines = data.split('\n');
	
			l = 0;
			while(l < lines.length){
				line = lines[l];
	
				if(line.substr(0,3) == "PCB"){
	
					line = line.substr(4, line.length-2);
					splt = line.split(' ');
	
					this.name = splt[0].split('"')[1];
					this.width = parseInt(splt[1]);
					this.height = parseInt(splt[2]);
	
				} else if(line.substr(0,3) == "Via"){
	
					line = line.substr(4, line.length-2);
					splt = line.split(' ');
	
					new_obj = new Via(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]), splt[6].split('"')[1], splt[7].split('"')[1]);
	
					this.vias.push(new_obj);
	
				} else if(line.substr(0, 7) == "Element"){
	
					line = line.substr(8,line.length-2);
					splt = line.match(/[^\s"]+|"([^"]*)"/gi); // TODO: change all space splits with text to this regex
	
					new_obj = new Element(this, splt[0].split('"')[1], splt[1].split('"')[1], splt[2].split('"')[1], splt[3].split('"')[1], parseInt(splt[4]), parseInt(splt[5]), parseInt(splt[6]), parseInt(splt[7]), parseInt(splt[8]), parseInt(splt[9]), splt[7].split('"')[10]);
	
					while(line[0] != ')'){
						l++;
						line = lines[l];
						line = line.trim();
	
						if(line.substr(0, 3) == 'Pad'){
	
							line = line.substr(4, line.length-2);
							splt = line.split(' ');
	
							sub_obj = new Pad(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]), parseInt(splt[6]), splt[7].split('"')[1], splt[8].split('"')[1], splt[9].split('"')[1]);	
							sub_obj.parent = new_obj;

							new_obj.parts.push(sub_obj);
	
						} else if(line.substr(0, 3) == 'Pin'){
	
							line = line.substr(4, line.length-2);
							splt = line.match(/[^\s"]+|"([^"]*)"/gi);
	
							sub_obj = new Pin(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]), splt[6].split('"')[1], splt[7].split('"')[1], splt[8].split('"')[1]);
							sub_obj.parent = new_obj;

							new_obj.parts.push(sub_obj);
	
						} else if(line.substr(0, 11) == 'ElementLine'){
	
							line = line.substr(13, line.length-2);
							splt = line.split(' ');
	
							sub_obj = new ElementLine(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]));
							sub_obj.parent = new_obj;

							new_obj.parts.push(sub_obj);
	
						} else if(line.substr(0, 10) == 'ElementArc'){
	
							line = line.substr(12, line.length-2);
							splt = line.split(' ');
	
							sub_obj = new ElementArc(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]), parseInt(splt[6]));
							sub_obj.parent = new_obj;

							new_obj.parts.push(sub_obj);
	
						};
	
					}
	
					this.elements.push(new_obj);
	
				} else if(line.substr(0, 5) == "Layer"){
	
					line = line.substr(6,line.length-2);
					splt = line.split(' ');
	
					new_obj = new Layer(this, parseInt(splt[0]), splt[1].split('"')[1]);
	
					while(line[0] != ')'){
						l++;
						line = lines[l];
						line = line.trim();
	
						if(line.substr(0, 4) == 'Line'){
	
							line = line.substr(5, line.length-2);
							splt = line.split(' ');
	
							sub_obj = new Line(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]), splt[6].split('"')[1]);
	
							new_obj.parts.push(sub_obj);
	
						} else if(line.substr(0, 4) == 'Text'){
	
							line = line.substr(5, line.length-2);
							splt = line.match(/[^\s"]+|"([^"]*)"/gi);
	
							sub_obj = new Text(this, parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), splt[4].split('"')[1], splt[5].split('"')[1]);
	
							new_obj.parts.push(sub_obj);
	
						};
	
					}
	
					this.layers.push(new_obj);
	
				} else if(line.substr(0, 6) == "Symbol"){
	
					line = line.substr(7, line.length-2);
	
					new_obj = new Symbol(line.substr(1,1), parseInt(line.substr(4,line.length-2).replace(']', '')));

					xmi = undefined;
					xma = undefined;
	
					while(line[0] != ')'){
						l++;
						line = lines[l];
						line = line.trim();
	
						if(line.substr(0, 10) == 'SymbolLine'){
	
							line = line.substr(11, line.length-2);
							splt = line.split(' ');
	
							sub_obj = new Line(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]));
	
							if(xmi == undefined) xmi = sub_obj.x1;					
							else if(xmi > sub_obj.x1) xmi = sub_obj.x1;
							if(xmi > sub_obj.x2) xmi = sub_obj.x2;
							if(xma == undefined) xma = sub_obj.x1;
							else if(xma < sub_obj.x1) xma = sub_obj.x1;
							if(xma < sub_obj.x2) xma = sub_obj.x2;

							new_obj.lines.push(sub_obj);

						};
	
					}
	
					if(new_obj.name == ' ') new_obj.width = 1800;
					else new_obj.width = Math.abs(xma-xmi);
	
					this.symbols[new_obj.name] = new_obj;
	
				} else if(line.substr(0, 7) == "Polygon"){
	
					//
	
				}
	
				l++;
	
			}
	
			this.offset = {};	// Board offset to render at
			this.offset.x = 0;
			this.offset.y = 0;
	
			this.side = Layer.SOLDER;
	
			this.scale = 1.0;

			if(this.mode == "Accelerated"){

				var top = [], solder = [], pins = [];

				this.layerManager = new LayerManager(this.layers);

				var i, j;
				for(i = 0; i < this.elements.length; i++){

					if(!this.elements[i].onsolder()){
						this.layerManager.bottomSilk.parts.push(this.elements[i]);
					} else {
						this.layerManager.topSilk.parts.push(this.elements[i]);
					}

					for(j = 0; j < this.elements[i].parts.length; j++){
						if(this.elements[i].parts[j] instanceof Pin)
							pins.push(this.elements[i].parts[j]);
						else if(
						  this.elements[i].parts[j] instanceof ElementLine ||
						  this.elements[i].parts[j] instanceof ElementArc ||
						  this.elements[i].parts[j] instanceof Text
						 ){
							if(!this.elements[i].onsolder())
								this.layerManager.bottomSilk.parts.push(this.elements[i].parts[j]);
							else
								this.layerManager.topSilk.parts.push(this.elements[i].parts[j]);
						} else if(this.elements[i].onsolder())
							solder.push(this.elements[i].parts[j]);
						else
							top.push(this.elements[i].parts[j]);
					}
				}

				for(i in this.symbols){
					this.symbols[i].init3DArrays(this.ctx);
				}

				for(i = 0; i < this.vias.length; i++){
					pins.push(this.vias[i]);
				}

				this.layerManager.top = new Layer(this, -1, "top_component", top);
				this.layerManager.solder = new Layer(this, -2, "solder_component", solder);
				this.layerManager.pins = new Layer(this, -3, "pins", pins);
				this.layerManager.layers.push(this.layerManager.top);
				this.layerManager.layers.push(this.layerManager.solder);
				this.layerManager.layers.push(this.layerManager.pins);

				this.layerManager.setupFramebuffers(this.ctx);
				this.layerManager.init3DArrays(this.ctx);
				this.layerManager.setupGL(this.ctx, this.width, this.height);

			}
			
		};
		
		PCBV.prototype.wheel = function(e) {
	
			var	ev = window.event || e,
				d,
				elem = this.canvas,
				doc = elem && elem.ownerDocument,
				docElem = doc.documentElement,
				box = elem.getBoundingClientRect(),
				off = {
					top: box.top  + (window.pageYOffset || docElem.scrollTop)  - (docElem.clientTop  || 0),
					left: box.left + (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
				};
	
			if(ev.stopPropagation) ev.stopPropagation();
			if(ev.preventDefault) ev.preventDefault();
			ev.returnValue = false;
	
			d = Math.max(-1, Math.min(1, (ev.wheelDelta || -ev.detail)));
	
			this.update_mouse_scroll(this.mouse_x-off.left, this.mouse_y-off.top, d);
	
		};
	
		// Key event handler
		PCBV.prototype.update_key = function(e){
	
			var which = e.which, prevent = true;
	
			var shift = 10;

			switch(which){
				case 38: // Down
					if(this.side) this.offset.y -= this.height/shift;
					else this.offset.y += this.height/shift;
					break;
				case 37: // Left
					this.offset.x += this.width/shift;
					break;
				case 39: // Right
					this.offset.x -= this.width/shift;
					break;
				case 40: // Up
					if(this.side) this.offset.y += this.height/shift;
					else this.offset.y -= this.height/shift;
					break;
				case 65: // Flip side
					this.side = !this.side;
					break;
				case 90: // Z : Zoom in
					this.offset.y += ((this.canvas.height-(this.canvas.height/1.1))/2)/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
					this.offset.x += ((this.canvas.width-(this.canvas.width/1.1))/2)/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
					this.scale *= 1.1;
					break;
				case 88: // X : Zoom out
					this.offset.y += ((this.canvas.height-(this.canvas.height*1.1))/2)/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
					this.offset.x += ((this.canvas.width-(this.canvas.width*1.1))/2)/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
					this.scale /= 1.1;
					break;
				default:
					prevent = false;
			}
	
			if(prevent){
				if(e.stopPropagation) e.stopPropagation();
				if(e.preventDefault) e.preventDefault();
				e.returnValue = false;
			}
	
			this.render();
		
		};
	
		// Drag event handler
		PCBV.prototype.update_mouse_drag = function(x, y){

			var dx, dy, min;

				min = Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale;

				dy = y / min;
	            dx = x / min;

			if(this.side) this.offset.y -= dy;
			else this.offset.y += dy;
			this.offset.x += dx;

			this.render();
	
		};
	
		// Scroll event handler
		PCBV.prototype.update_mouse_scroll = function(x, y, s){

			if(s > 0){ // Zoom in
				if(this.side) this.offset.y += (((this.canvas.height-(this.canvas.height/1.1))/2)*((this.canvas.height-y)/this.canvas.height*2))/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
				else this.offset.y += (((this.canvas.height-(this.canvas.height/1.1))/2)*(2-((this.canvas.height-y)/this.canvas.height*2)))/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
				this.offset.x += (((this.canvas.width-(this.canvas.width/1.1))/2)*(2-((this.canvas.width-x)/this.canvas.width*2)))/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
				this.scale *= 1.1;
			} else { // Zoom out
				if(this.side) this.offset.y += (((this.canvas.height-(this.canvas.height*1.1))/2)*((this.canvas.height-y)/this.canvas.height*2))/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
				else this.offset.y += (((this.canvas.height-(this.canvas.height*1.1))/2)*(2-((this.canvas.height-y)/this.canvas.height*2)))/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
				this.offset.x += (((this.canvas.width-(this.canvas.width*1.1))/2)*(2-((this.canvas.width-x)/this.canvas.width*2)))/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
				this.scale /= 1.1;
			}
			this.render();
		};

		PCBV.prototype.render_layers = function(){
	
			this.buffer_ctx.clearRect(0, 0, this.buffer_layer.width, this.buffer_layer.height);
		
			var bot_silk = null, top_silk = null,
				i;
	
			for(i = 0; i < this.layers.length; i++){
				if(this.layers[i].name == 'silk'){
					if(top_silk) bot_silk = this.layers[i];
					else top_silk = this.layers[i];
				};
			}
		
			if(this.side) bot_silk.render(this.buffer_ctx, '#FFFFFF');
			else top_silk.render(this.buffer_ctx, '#FFFFFF');
		
			if(this.side){
				for(i = 0; i < this.layers.length; i++)
					if(this.layers[i].name != 'silk') this.layers[i].render(this.buffer_ctx);
			} else {
				for(i = this.layers.length-1; i >= 0; i--)
					if(this.layers[i].name != 'silk') this.layers[i].render(this.buffer_ctx);
			}
		
			if(this.side) top_silk.render(this.buffer_ctx);
			else bot_silk.render(this.buffer_ctx);
		
			this.ctx.drawImage(this.buffer_layer, 0, 0);
		
		};

		PCBV.prototype._do_render = function(){

			// Calculate how much we need to scale based on size of the
			// pcb vs canvas size and how zoomed in we are
			scalef = Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale;

			if(this.mode == "Accelerated"){

				if(this.resized){
					for(var i = 0; i < this.layers.length; i++){
						this.layers[i].resizeFrameBuffer(this.ctx);
					}
					this.resized = false;
				}

				this.layerManager.renderGL(this.ctx, this.shaderProgram, this.texShaderProgram, this.side, this.offset.x, this.offset.y, scalef);

			} else {

				// Fill canvas background Dark Grey
				this.buffer_ctx.fillStyle = '#CCCCCC';
				this.buffer_ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
			
				// Save default tranform
				this.buffer_ctx.save();
			
				// Flip canvas if solder side
				if(this.side){
					this.buffer_ctx.scale(1, -1);
					this.buffer_ctx.translate(0, -this.canvas.height);
				}
			
				// Scale and shift
				this.buffer_ctx.scale(scalef, scalef);
				this.buffer_ctx.translate(-this.offset.x, -this.offset.y);	

				// Fill board space Grey
				this.buffer_ctx.fillStyle = '#E5E5E5';
				this.buffer_ctx.fillRect(0, 0, this.width, this.height);

				this.ctx.globalAlpha = 1.0;
			
				this.ctx.drawImage(this.buffer_layer, 0, 0);
			
				this.ctx.globalAlpha = 0.5;
			
				this.buffer_ctx.clearRect(0, 0, this.buffer_layer.width, this.buffer_layer.height);
				for(i = 0; i < this.elements.length; i++) if(!this.elements[i].onsolder() != !this.side) this.elements[i].render(this.buffer_ctx, '#FFFFFF', !this.side);
				this.ctx.drawImage(this.buffer_layer, 0, 0);
			
				this.render_layers();
			
				this.buffer_ctx.clearRect(0, 0, this.buffer_layer.width, this.buffer_layer.height);
				for(i = 0; i < this.elements.length; i++) if(this.elements[i].onsolder() == this.side) this.elements[i].render(this.buffer_ctx, '#000000', this.side);
				for(i = 0; i < this.elements.length; i++) if(!this.elements[i].onsolder() != !this.side) this.elements[i].render(this.buffer_ctx, '#000000', this.side, true);
				this.ctx.drawImage(this.buffer_layer, 0, 0);
			
				this.buffer_ctx.clearRect(0, 0, this.buffer_layer.width, this.buffer_layer.height);
				for(i = 0; i < this.vias.length; i++) this.vias[i].render(this.buffer_ctx);
				this.ctx.drawImage(this.buffer_layer, 0, 0);
			
				// Restore default tranform
				this.buffer_ctx.restore();

			}

			this.end_time = (new Date()).getTime();

		}

		PCBV.prototype.render = function(force, timeout){
		
			var scalef, i, cur_time = (new Date()).getTime(), t = this, gl;
		
			// Limit refresh rate to 30 FPS, wait 10 millis for screen refresh
			// Also, only renders when somethings changed, i.e. Drag/Zoom
			if((Math.abs(cur_time-this.last_time) > 33 && Math.abs(cur_time-this.end_time) > 11) || force){
				this.last_time = cur_time;
			} else { // incase last render call from event was ignored
				if(!timeout) setTimeout(function(){t.render(false, true);}, 50);
				return;		
			}

			// Using requestAnimFrame prevents Screen Tearing
			window.requestAnimFrame(function(){t._do_render();});

		};

		window.requestAnimFrame = (function() {
			return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(callback, element) {
				window.setTimeout(callback, 1000/60);
			};
		})();
		
		return PCBV;

	}
);