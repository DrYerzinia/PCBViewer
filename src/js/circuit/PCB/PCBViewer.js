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
	 	"./Polygon",
	 	"./Symbol",
	 	"./Renderers/TwoDRenderer",
	 	"./Renderers/GLRenderer",
	 	"Util/DOM",
	 	"Util/Touch/Touch"
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
		Polygon,
		Symbol,
		TwoDRenderer,
		GLRenderer,
		DOM,
		Touch
	){

		function PCBV(canvas, attach, mode) {

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

				} else {

					this.mode = "Accelerated";

				}

				this.last_time = 0;
				this.end_time = 0;
		
				this._setupEventHandlers();

			};

			console.log("Mode: " + this.mode);
		
		};

		PCBV.prototype.destroy = function(){

			this.renderer.destroy();

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
			this.canvas.ontouchstart = null;
			this.canvas.ontouchmove = null;
			this.canvas.ontouchend = null;
			this.canvas.ontouchcancel = null;
			this.canvas.ontouchleave = null;

		};

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

		PCBV.prototype._buildLayers = function(){

			var top = [], solder = [], pins = [];

			var i, j;
			for(i = 0; i < this.elements.length; i++){

				if(!this.elements[i].onsolder()){
					this.renderer.bottomSilk.parts.push(this.elements[i]);
				} else {
					this.renderer.topSilk.parts.push(this.elements[i]);
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
							this.renderer.bottomSilk.parts.push(this.elements[i].parts[j]);
						else
							this.renderer.topSilk.parts.push(this.elements[i].parts[j]);
					} else if(this.elements[i].onsolder())
						solder.push(this.elements[i].parts[j]);
					else
						top.push(this.elements[i].parts[j]);
				}
			}

			for(i = 0; i < this.vias.length; i++)
				pins.push(this.vias[i]);

			this.renderer.addLayer(new Layer(this, -1, "top_component", top));
			this.renderer.addLayer(new Layer(this, -2, "solder_component", solder));
			this.renderer.addLayer(new Layer(this, -3, "pins", pins));

		};

		PCBV.prototype._setupEventHandlers = function(){

			this.clicking = false;
			
			this.mouseX = this.canvas.width / 2;
			this.mouseY = this.canvas.height/ 2;
	
			this.mouseUpFunction = function(t){return function(e){if(e.which == 1) t.clicking = false;};}(this);
			this.mouseDownFunction = function(t){return function(e){if(e.which == 1) t.clicking = true;};}(this)
			this.keyDownFunction = function(t){return function(e){t._updateKey(e);};}(this);
			this.mouseMoveFunction = function(t){return function(e){
				if(t.clicking)
					t._updateMouseDrag(t.mouseX-e.pageX, t.mouseY-e.pageY);		
				t.mouseX = e.pageX;
				t.mouseY = e.pageY;
			};}(this);
			this.mouseWheelFunction = function(t){return function(e){t._wheel(e);};}(this);
			this.onTouchStartFunction = function(t){return function(e){t._touchStart(e);};}(this);
			this.onTouchMoveFunction = function(t){return function(e){t._touchMove(e);};}(this);
			this.onTouchEndFunction = function(t){return function(e){t._touchEnd(e);};}(this);
			this.onTouchCancelFunction = function(t){return function(e){e.preventDefault();};}(this);
			
			if(window.addEventListener){
				document.addEventListener("mouseup", this.mouseUpFunction, false);
				this.canvas.addEventListener("mousewheel", this.mouseWheelFunction, false);
				this.canvas.addEventListener('DOMMouseScroll', this.mouseWheelFunction, false);
			} else {
				document.attachEvent("mouseup", this.mouseUpFunction);
				this.canvas.attachEvent("onmousewheel", this.mouseWheelFunction);
			}
			this.canvas.onmousedown = this.mouseDownFunction;
			this.canvas.onkeydown = this.keyDownFunction;
			this.canvas.onmousemove = this.mouseMoveFunction;
			this.canvas.ontouchstart = this.onTouchStartFunction;
			this.canvas.ontouchmove = this.onTouchMoveFunction;
			this.canvas.ontouchend = this.onTouchEndFunction;
			this.canvas.ontouchcancel = this.onTouchCancelFunction;
			this.canvas.ontouchleave = this.onTouchEndFunction;

			this.touches = [];

		}

		PCBV.prototype._touchStart = function(e){

			e.preventDefault();
			var tch = e.changedTouches;

			for(var i = 0; i < tch.length; i++){
				this.touches.push(Touch.from_touch(tch[i]));
			}

			if(this.touches.length == 1){

				this.mouse_down_x = this.touches[0].x;
				this.mouse_down_y = this.touches[0].y;

				this.touch_clicking = true;

			}

			// If 2 fingers we are zooming in/out
			else if(this.touches.length == 2){

				this.scale_distance_last = Math.sqrt( Math.pow(this.touches[0].x - this.touches[1].x, 2) + Math.pow(this.touches[0].y - this.touches[1].y, 2) );
				this.scale_delta = 0;

				this.touch_clicking = false;

			}

		};

		PCBV.prototype._touchMove = function(e){

			e.preventDefault();
			var tch = e.changedTouches;

			// If 1 finger we are dragging
			if(this.touches.length == 1){

				var ot = this.touches[0];
					nt = Touch.from_touch(tch[0]),
					dx = ot.x - nt.x,
					dy = ot.y - nt.y;

				this._updateMouseDrag(dx, dy);

			}

			// update the touches
			for(var i = 0; i < tch.length; i++){
				for(var j = 0; j < this.touches.length; j++){
					if(this.touches[j].id == tch[i].identifier){
						this.touches[j].x = tch[i].pageX;
						this.touches[j].y = tch[i].pageY;
						break;
					}
				}
			}

			// If 2 fingers we are zooming in/out
			if(this.touches.length == 2){

				var touch_distance = Math.sqrt( Math.pow(this.touches[0].x - this.touches[1].x, 2) + Math.pow(this.touches[0].y - this.touches[1].y, 2) );

				var center = {x: 0, y: 0};
				center.x = (this.touches[0].x + this.touches[1].x)/2;
				center.y = (this.touches[0].y + this.touches[1].y)/2;

				var off = DOM.offset(this.canvas),
					px = center.x - off.x,
					py = center.y - off.y;

				// Set partial scale
				var change = this.scale_distance_last - touch_distance;
				var scaled = Math.floor(change/40);
				if(scaled != this.scale_delta){

					if(scaled > this.scale_delta){
						this._updateMouseScroll(px, py, -1);
					} else {
						this._updateMouseScroll(px, py, 1);
					}
					this.scale_delta = scaled;
				}
			}

		};
		PCBV.prototype._touchEnd = function(e){

			e.preventDefault();

			var tch = e.changedTouches;

			// remove the touch
			for(var i = 0; i < tch.length; i++){
				for(var j = 0; j < this.touches.length; j++){
					if(this.touches[j].id == tch[i].identifier){
						this.touches.splice(j, 1);
							break;
					}
				}
			}

		};

		PCBV.prototype._wheel = function(e) {
			
			var	ev = window.event || e,
				d,
				off = DOM.offset(this.canvas);
	
			if(ev.stopPropagation) ev.stopPropagation();
			if(ev.preventDefault) ev.preventDefault();
			ev.returnValue = false;
	
			d = Math.max(-1, Math.min(1, (ev.wheelDelta || -ev.detail)));
	
			this._updateMouseScroll(this.mouseX - off.x, this.mouseY - off.y, d);
	
		};
	
		// Key event handler
		PCBV.prototype._updateKey = function(e){
	
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
		PCBV.prototype._updateMouseDrag = function(x, y){

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
		PCBV.prototype._updateMouseScroll = function(x, y, s){

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

		PCBV.prototype._doRender = function(){

			// Calculate how much we need to scale based on size of the
			// pcb vs canvas size and how zoomed in we are
			scalef = Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale;

			if(this.resized){
				this.renderer.resize();
				this.resized = false;
			}

			this.renderer.render(this.side, this.offset.x, this.offset.y, scalef);

			this.end_time = (new Date()).getTime();

		};

		PCBV.prototype.getLayerColors = function(){
			return this._layerColors;
		};

		PCBV.prototype.resize = function(){
			this.resized = true;
		};

		PCBV.prototype.setup = function(){

			this.offset = {};	// Board offset to render at
			this.offset.x = 0;
			this.offset.y = 0;
	
			this.side = Layer.SOLDER;
	
			this.scale = 1.0;

			if(this.mode == "Accelerated")
				this.renderer = new GLRenderer(this.ctx, this.canvas, this.symbols, this.layers, this.width, this.height);
			else
				this.renderer = new TwoDRenderer(this.ctx, this.canvas, this.symbols, this.layers, this.width, this.height);

			this._buildLayers();
			this.renderer.setup();

		};

		PCBV.prototype.parse = function(data){
	
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
	
						} else if(line.substr(0, 7) == "Polygon"){

							var flags = line.substr(9,line.length-11), points = [];

							line = '';
							while(line.indexOf(')') == -1){

								l++;
								line = lines[l];

								var bracket_idx = line.indexOf('[');
								while(bracket_idx != -1){

									var space_idx = line.indexOf(' ', bracket_idx);

									var newPoint = {
										x: parseFloat(line.substring(bracket_idx + 1, space_idx)),
										y: parseFloat(line.substring(space_idx + 1, line.indexOf(']', space_idx))),
									};
									points.push(newPoint);
									bracket_idx++;
									bracket_idx = line.indexOf('[', bracket_idx);

								}

							}

							sub_obj = new Polygon(flags, points);
							new_obj.parts.push(sub_obj);

						}

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
	
				} else {}
	
				l++;
	
			}

		};

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
			window.requestAnimFrame(function(){t._doRender();});

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