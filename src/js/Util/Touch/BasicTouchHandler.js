define(
	[
	 	"./Touch",
	 	"Util/DOM"
	],
	function(
		Touch,
		DOM
	){

		var BasicTouchHandler = function(element, onScale, scaleStep, onDrag, onClick, onDoubleClick){

			this.element = element;
			this.onScale = onScale;
			this.scaleStep = scaleStep;
			this.onDrag = onDrag;
			this.onClick = onClick;
			this.onDoubleClick = onDoubleClick;

			this.onTouchStartFunction = function(t){return function(e){t._touchStart(e);};}(this);
			this.onTouchMoveFunction = function(t){return function(e){t._touchMove(e);};}(this);
			this.onTouchEndFunction = function(t){return function(e){t._touchEnd(e);};}(this);
			this.onTouchCancelFunction = function(t){return function(e){e.preventDefault();};}(this);

			this.element.ontouchstart = this.onTouchStartFunction;
			this.element.ontouchmove = this.onTouchMoveFunction;
			this.element.ontouchend = this.onTouchEndFunction;
			this.element.ontouchcancel = this.onTouchCancelFunction;
			this.element.ontouchleave = this.onTouchEndFunction;

			this.touchDownX = 0;
			this.touchDownY = 0;

			this.touchClicking = false;

			this.touches = [];

		};

		BasicTouchHandler.prototype.destroy = function(){

			this.element.ontouchstart = null;
			this.element.ontouchmove = null;
			this.element.ontouchend = null;
			this.element.ontouchcancel = null;
			this.element.ontouchleave = null;

		};

		BasicTouchHandler.prototype._touchStart = function(e){

			e.preventDefault();
			var tch = e.changedTouches;

			for(var i = 0; i < tch.length; i++){
				this.touches.push(Touch.fromTouch(tch[i]));
			}

			if(this.touches.length == 1){

				this.touchDownX = this.touches[0].x;
				this.touchDownY = this.touches[0].y;

				this.touchClicking = true;

			}

			// If 2 fingers we are zooming in/out
			else if(this.touches.length == 2){

				this.scaleDistanceLast = Math.sqrt( Math.pow(this.touches[0].x - this.touches[1].x, 2) + Math.pow(this.touches[0].y - this.touches[1].y, 2) );
				this.scaleDelta = 0;

				this.touchClicking = false;

			}

		};

		BasicTouchHandler.prototype._touchMove = function(e){

			e.preventDefault();
			var tch = e.changedTouches;

			// If 1 finger we are dragging
			if(this.touches.length == 1){

				var ot = this.touches[0];
					nt = Touch.fromTouch(tch[0]),
					dx = ot.x - nt.x,
					dy = ot.y - nt.y;

				if(
					this.touchDownX > nt.x + 10 ||
					this.touchDownX < nt.x - 10 ||
					this.touchDownY > nt.y + 10 ||
					this.touchDownY < nt.y - 10
				){
					this.touchClicking = false;
				}

				if(this.onDrag)
					this.onDrag(dx, dy);

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

				var touchDistance = Math.sqrt( Math.pow(this.touches[0].x - this.touches[1].x, 2) + Math.pow(this.touches[0].y - this.touches[1].y, 2) );

				var center = {x: 0, y: 0};
				center.x = (this.touches[0].x + this.touches[1].x)/2;
				center.y = (this.touches[0].y + this.touches[1].y)/2;

				var off = DOM.offset(this.element),
					px = center.x - off.x,
					py = center.y - off.y;

				// Set partial scale
				var change = this.scaleDistanceLast - touchDistance;
				var scaled = Math.floor(change/this.scaleStep);
				if(scaled != this.scaleDelta){

					if(scaled > this.scaleDelta){
						this.onScale(px, py, -1);
					} else {
						this.onScale(px, py, 1);
					}
					this.scaleDelta = scaled;
				}
			}

		};

		BasicTouchHandler.prototype._touchEnd = function(e){

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

			// Check for double tap to zoom
			if(this.touches.length == 0){

				if(this.touchClicking)
					if(this.onClick)
						this.onClick(tch[0].pageX, tch[0].pageY);

				var now = Date.now();
				if(now - this.lastTap < 300){
					var off = DOM.offset(this.element),
						x = (tch[0].pageX - off.x) / this.element.width,
						y = (tch[0].pageY - off.y) / this.element.height;

					if(this.onDoubleClick)
						this.onDoubleClick(x, y, 1);
				}
				this.lastTap = now;

			}

		};

		return BasicTouchHandler;

	}
);