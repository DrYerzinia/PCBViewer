// PCBViewer.js
// Michael Marques / DrYerzinia / KD0WGV
// 09-10-2013
// r4
//
// This is a Viewer for PCB files from
// gEDA tools PCB software
//

define(function(){

	function PCBV(canvas, attach) {
	
		this.vias = [];
		this.layers = [];
		this.elements = [];
		this.symbols = {};
		this.canvas = canvas;
	
		if(attach){
	
			this.ctx = canvas.getContext('2d');
	
			this.buffer_layer = document.createElement('canvas');
			this.buffer_layer.width = this.canvas.width;
			this.buffer_layer.height = this.canvas.height;
	
			this.buffer_ctx = this.buffer_layer.getContext('2d');
	
			this.last_time = 0;
			this.end_time = 0;
	
			this.clicking = false;
		
			this.mouse_x = canvas.width/2;
			this.mouse_y = canvas.height/2;
	
			if(window.addEventListener){
				document.addEventListener("mouseup", function(t){return function(e){if(e.which == 1) t.clicking = false;};}(this), false);
			} else document.attachEvent("mouseup", function(t){return function(e){if(e.which == 1) t.clicking = false;};}(this));
			canvas.onmousedown = function(t){return function(e){if(e.which == 1) t.clicking = true;};}(this);
			canvas.onkeydown = function(t){return function(e){t.update_key(e);};}(this);
						
			canvas.onmousemove = function(t){return function(e){	
				if(t.clicking)
					t.update_mouse_drag(t.mouse_x-e.pageX, t.mouse_y-e.pageY);		
				t.mouse_x = e.pageX;
				t.mouse_y = e.pageY;
			};}(this);
		
			if(window.addEventListener){
				this.canvas.addEventListener("mousewheel", function(t){return function(e){t.wheel(e);};}(this), false);
			        this.canvas.addEventListener('DOMMouseScroll', function(t){return function(e){t.wheel(e);};}(this), false);
			} else this.canvas.attachEvent("onmousewheel", function(t){return function(e){t.wheel(e);};}(this));
	
		};
	
	};
	
	PCBV.prototype.resize = function(){
	
		this.buffer_layer.width = this.canvas.width;
		this.buffer_layer.height = this.canvas.height;
	
	};

	// TODO: maybe make this layer named based!
	PCBV.layer_color = ['#8B2323', '#3A5FCD', '#104E8B', '#CD3700',
			'#548B54', '#8B7355', '#00868B', '#228B22',
			'#000000', '#000000'];
	
	PCBV.prototype.Line = function(x1, y1, x2, y2, thick, notsure, notsure2){
	
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.thick = thick;
	
	};

	PCBV.prototype.Line.prototype.render = function(ctx, color){
	
		ctx.beginPath();
		ctx.moveTo(this.x1, this.y1);
		ctx.lineTo(this.x2, this.y2);
		ctx.lineCap = 'round';
		ctx.lineWidth = this.thick;
		ctx.strokeStyle = color;
		ctx.stroke();
		ctx.closePath();
	
	};

	PCBV.prototype.Text = function(pcbv, x, y, angle, scaling, str, flags){
	
		this.pcbv = pcbv;
		this.x = x;
		this.y = y;
	
		switch(angle){
			case 0:
				this.angle = 0;
				break;
			case 1:
				this.angle = -0.5*Math.PI;
				break;
			case 2:
				this.angle = Math.PI;
				break;
			case 3:
				this.angle = 0.5*Math.PI;
				break;
		}

		this.scaling = scaling;
		this.str = str;
		this.flags = flags;

	};

	PCBV.prototype.Text.prototype.render = function(ctx, color){
	
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.angle);
		if(this.angle == Math.PI) ctx.scale(1, -1);
		for(var i = 0; i < this.str.length; i++){
			sym = this.pcbv.symbols[this.str[i]];
			sym.render(ctx, color);
			ctx.translate(sym.width+1000, 0);
		}
		ctx.restore();

	};

	PCBV.prototype.Layer = function(pcbv, number, name){

		this.pcbv = pcbv;
		this.number = number;
		this.name = name;
		this.parts = [];

	};

	PCBV.prototype.Layer.prototype.render = function(ctx, color){

		if(!color) color = PCBV.layer_color[this.number-1];

		for(var p = 0; p < this.parts.length; p++)
			this.parts[p].render(ctx, color);

	};
	
	PCBV.prototype.Via = function(x, y, od, u1, u2, id, u3, u4){

		this.x = x;
		this.y = y;
		this.od = od;
		this.id = id;

	};

	PCBV.prototype.Via.prototype.render = function(ctx){
	
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.od/2, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fillStyle = '#7F7F7F'; // TODO: set colors to global option
		ctx.fill();
	
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.id/2, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fillStyle = '#E5E5E5'; // TODO: set colors to global option
		ctx.fill();
	
	};

	// Element [element_flags, description, pcb-name, value, mark_x, mark_y, text_x, text_y, text_direction, text_scale, text_flags]
	PCBV.prototype.Element = function(pcbv, flags, desc, refdes, val, mx, my, tx, ty, txtdir, txtscl, txtflg){
	
		this.pcbv = pcbv;
		this.flags = flags;
		this.desc = desc;
		this.refdes = refdes;
		this.mx = mx;
		this.my = my;
		this.tx = tx;
		this.ty = ty;
		this.txtdir = txtdir;
		this.txtscl = txtscl;
		this.txtflg = txtflg;
		this.parts = [];
	
	};

	PCBV.prototype.Element.prototype.onsolder = function(){
	
		var splt = this.flags.split(',');
	
		for(var i = 0; i < splt.length; i++) if(splt[i] == 'onsolder') return true;
		return false;
	
	};

	PCBV.prototype.Element.prototype.render = function(ctx, color, mirror, pins_only){
	
		var i, sym, rot = 0;
	
		ctx.save();
		ctx.translate(this.mx, this.my);
		for(i = 0; i < this.parts.length; i++){
			if(pins_only){
				if(this.parts[i] instanceof PCBV.prototype.Pin) this.parts[i].render(ctx, color);
			} else {
				this.parts[i].render(ctx, color);
			};
		}
		if(pins_only){
			ctx.restore();
			return;
		}
	
		switch(this.txtdir){
		case 0:
			rot = 0;
			break;
		case 1:
			rot = -0.5*Math.PI;
			break;
		case 2:
			rot = Math.PI;
			break;
		case 3:
			rot = 0.5*Math.PI;
			break;
		}

		ctx.save();
		ctx.translate(this.tx, this.ty);
		if(mirror) ctx.scale(1, -1);
		ctx.rotate(rot);

		for(i = 0; i < this.refdes.length; i++){
			sym = this.pcbv.symbols[this.refdes[i]];
			sym.render(ctx, color);
			ctx.translate(sym.width+1000, 0);
		}

		ctx.restore();
		ctx.restore();
	
	};

	// Pad [x1 y1 x2 y2 thickness clearance mask name pad_number flags]
	PCBV.prototype.Pad = function(x1, y1, x2, y2, thick, clear, mask, name, pnum, flags){

		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.thick = thick;
		this.clear = clear;
		this.mask = mask;
		this.name = name;
		this.pnum = pnum;
		this.flags = flags;

	};

	PCBV.prototype.Pad.prototype.render = function(ctx, color){

		if(color == '#FFFFFF') ctx.fillStyle = color;
		else ctx.fillStyle = '#4D4D4D'; // TODO: global color
		ctx.fillRect(this.x1-(this.thick/2), this.y1-(this.thick/2), this.x2-this.x1+(this.thick), this.y2-this.y1+(this.thick));

	};

	// Pin [x y thickness clearance mask drillholedia name number flags]
	PCBV.prototype.Pin = function(x, y, thick, clear, mask, drill, name, num, flags){

		this.x = x;
		this.y = y;
		this.thick = thick;
		this.clear = clear;
		this.mask = mask;
		this.drill = drill;
		this.name = name;
		this.num = num;
		this.flags = flags;

	};

	PCBV.prototype.Pin.prototype.render = function(ctx, color){
	
		if(color == '#FFFFFF') return;

		var	i,
			splt = this.flags.split(','),
			square = false;

		for(i = 0; i < splt.length; i++) if(splt[i] == 'square') square = true;

		ctx.beginPath();
		if(square) ctx.rect(this.x-this.thick/2, this.y-this.thick/2, this.thick, this.thick);
		else ctx.arc(this.x, this.y, this.thick/2, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fillStyle = '#4D4D4D'; // TODO: global color
		ctx.fill();

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.drill/2, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fillStyle = '#E5E5E5'; // TODO: set colors to global option
		ctx.fill();

	};

	PCBV.prototype.ElementLine = function(x1, y1, x2, y2, thick){
	
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.thick = thick;

	};

	PCBV.prototype.ElementLine.prototype.render = function(ctx, color){
	
		ctx.beginPath();
		ctx.moveTo(this.x1, this.y1);
		ctx.lineTo(this.x2, this.y2);
		ctx.lineCap = 'round';
		ctx.lineWidth = this.thick;
		ctx.strokeStyle = color;
		ctx.stroke();
		ctx.closePath();
	
	};

	// ElementArc [x y r1 r2 startangle sweepangle thickness]
	PCBV.prototype.ElementArc = function(x, y, r1, r2, start, sweep, thick){
	
		this.x = x;
		this.y = y;
		this.r1 = r1;
		this.r2 = r2;
		this.start = start;
		this.sweep = sweep;
		this.thick = thick;
	
	};

	PCBV.prototype.ElementArc.prototype.render = function(ctx, color){

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r1, (Math.PI*2)-(Math.PI*this.start/180.0), (Math.PI*2)-(Math.PI*(this.start+this.sweep)/180.0), false); 
		ctx.lineCap = 'round';
		ctx.lineWidth = this.thick;
		ctx.strokeStyle = color;
		ctx.stroke();
		ctx.closePath();

	};

	PCBV.prototype.Symbol = function(name, unk){

		this.name = name;
		this.width = 0;
		this.lines = [];

	};

	PCBV.prototype.Symbol.prototype.render = function(ctx, color){

		for(var l = 0; l < this.lines.length; l++) this.lines[l].render(ctx, color);

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

				new_obj = new this.Via(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]), splt[6].split('"')[1], splt[7].split('"')[1]);

				this.vias.push(new_obj);

			} else if(line.substr(0, 7) == "Element"){

				line = line.substr(8,line.length-2);
				splt = line.match(/[^\s"]+|"([^"]*)"/gi); // TODO: change all space splits with text to this regex

				new_obj = new this.Element(this, splt[0].split('"')[1], splt[1].split('"')[1], splt[2].split('"')[1], splt[3].split('"')[1], parseInt(splt[4]), parseInt(splt[5]), parseInt(splt[6]), parseInt(splt[7]), parseInt(splt[8]), parseInt(splt[9]), splt[7].split('"')[10]);

				while(line[0] != ')'){
					l++;
					line = lines[l];
					line = line.trim();

					if(line.substr(0, 3) == 'Pad'){

						line = line.substr(4, line.length-2);
						splt = line.split(' ');

						sub_obj = new this.Pad(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]), parseInt(splt[6]), splt[7].split('"')[1], splt[8].split('"')[1], splt[9].split('"')[1]);

						new_obj.parts.push(sub_obj);

					} else if(line.substr(0, 3) == 'Pin'){

						line = line.substr(4, line.length-2);
						splt = line.match(/[^\s"]+|"([^"]*)"/gi);

						sub_obj = new this.Pin(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]), splt[6].split('"')[1], splt[7].split('"')[1], splt[8].split('"')[1]);

						new_obj.parts.push(sub_obj);

					} else if(line.substr(0, 11) == 'ElementLine'){

						line = line.substr(13, line.length-2);
						splt = line.split(' ');

						sub_obj = new this.ElementLine(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]));

						new_obj.parts.push(sub_obj);

					} else if(line.substr(0, 10) == 'ElementArc'){

						line = line.substr(12, line.length-2);
						splt = line.split(' ');

						sub_obj = new this.ElementArc(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]), parseInt(splt[6]));

						new_obj.parts.push(sub_obj);

					};

				}

				this.elements.push(new_obj);

			} else if(line.substr(0, 5) == "Layer"){

				line = line.substr(6,line.length-2);
				splt = line.split(' ');

				new_obj = new this.Layer(this, parseInt(splt[0]), splt[1].split('"')[1]);

				while(line[0] != ')'){
					l++;
					line = lines[l];
					line = line.trim();

					if(line.substr(0, 4) == 'Line'){

						line = line.substr(5, line.length-2);
						splt = line.split(' ');

						sub_obj = new this.Line(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]), splt[6].split('"')[1]);

						new_obj.parts.push(sub_obj);

					} else if(line.substr(0, 4) == 'Text'){

						line = line.substr(5, line.length-2);
						splt = line.match(/[^\s"]+|"([^"]*)"/gi);

						sub_obj = new this.Text(this, parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), splt[4].split('"')[1], splt[5].split('"')[1]);

						new_obj.parts.push(sub_obj);

					};

				}

				this.layers.push(new_obj);

			} else if(line.substr(0, 6) == "Symbol"){

				line = line.substr(7, line.length-2);

				new_obj = new this.Symbol(line.substr(1,1), parseInt(line.substr(4,line.length-2).replace(']', '')));

				xmi = undefined;
				xma = undefined;

				while(line[0] != ')'){
					l++;
					line = lines[l];
					line = line.trim();

					if(line.substr(0, 10) == 'SymbolLine'){

						line = line.substr(11, line.length-2);
						splt = line.split(' ');

						sub_obj = new this.Line(parseInt(splt[0]), parseInt(splt[1]), parseInt(splt[2]), parseInt(splt[3]), parseInt(splt[4]), parseInt(splt[5]));

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

			}

			l++;
		}

		this.offset = {};	// Board offset to render at
		this.offset.x = 0;
		this.offset.y = 0;

		this.side = false; // Top is false, Bottom is true

		this.scale = 1.0;

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

		switch(which){
			case 38: // Down
				if(this.side) this.offset.y -= this.height/10;
				else this.offset.y += this.height/10;
				break;
			case 37: // Left
				this.offset.x += this.width/10;
				break;
			case 39: // Right
				this.offset.x -= this.width/10;
				break;
			case 40: // Up
				if(this.side) this.offset.y += this.height/10;
				else this.offset.y -= this.height/10;
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
	
		var dy = y/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
	
		if(this.side) this.offset.y -= dy;
		else this.offset.y += dy;
		this.offset.x += x/(Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale);
	
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
	
	PCBV.prototype.render = function(force, timeout){
	
		var scalef, i, cur_time = (new Date()).getTime(), t = this;
	
		// Limit refresh rate to 30 FPS, wait 10 millis for screen refresh
		if((Math.abs(cur_time-this.last_time) > 33 && Math.abs(cur_time-this.end_time) > 11) || force){
			this.last_time = cur_time;
		} else { // incase last render call from event was ignored
			if(!timeout) setTimeout(function(){t.render(false, true);}, 50);
			return;		
		}
	
		// Calculate how much we need to scale based on size of the
		// pcb vs canvas size and how zoomed in we are
		scalef = Math.min(this.canvas.width/this.width, this.canvas.height/this.height)*this.scale,
	
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
	
		this.end_time = (new Date()).getTime();
	
	};

	return PCBV;

});