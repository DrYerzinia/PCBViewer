define(
	[],
	function(){

		var Polygon = function(flags, points){

			this.flags = {};
			this.points = points;

			var split, i;

			split = flags.split(',');
			for(i = 0; i < split.length; i++){

				//

			}

			// Decompose into triangles
			// turn into doubly linked list
			var previous, head, next;
			head = previous = {
					previous: null,
					next: null,
					self: this.points[0]
				}
			for(i = 1; i < this.points.length; i++){
				next = {
					previous: previous,
					next: null,
					self: this.points[i]
				}
				previous.next = next;
				previous = next;
			}
			previous.next = head;
			head.previous = previous;

			// look at sets of 3 nodes
			var pointCount = this.points.length, currentNode = head, triangles = [];
			while(pointCount > 3){

				previous = currentNode.previous;
				next = currentNode.next;

				// if they are convex cut out current node and make a triangle
				var dx1, dy1, dx2, dy2;

				dx1 = currentNode.self.x - previous.self.x;
				dy1 = currentNode.self.y - previous.self.y;
				dx2 = next.self.x - currentNode.self.x;
				dy2 = next.self.y - currentNode.self.y;

				var ang = Math.atan2(dy2, dx2) - Math.atan2(dy1, dx1);

				if(ang < 0){

					triangles.push(
						[
						 	[previous.self.x, previous.self.y],
						 	[currentNode.self.x, currentNode.self.y],
						 	[next.self.x, next.self.y]
						]
					);

					next.previous = previous;
					previous.next = next;
					currentNode = next;

					pointCount--;

				} else {
					currentNode = currentNode.next;
				}

			}

			triangles.push(
					[
					 	[currentNode.previous.self.x, currentNode.previous.self.y],
					 	[currentNode.self.x, currentNode.self.y],
					 	[currentNode.next.self.x, currentNode.next.self.y]
					]
				);

			this.triangles = triangles;

		};

		Polygon.prototype.render = function(ctx, color){

			ctx.beginPath();
			ctx.moveTo(this.points[0].x, this.points[0].y);
			for(var i = 1; i < this.points.length; i++)
				ctx.lineTo(this.points[i].x, this.points[i].y);
			ctx.closePath();
			ctx.fillStyle = color;
			ctx.fill();

		};

		Polygon.prototype.renderGL = function(gl, shaderProgram){

			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLES, 0, this.vertexBuffer.numItems);

		};

		Polygon.prototype.cleanupGL = function(gl){

			//

		};

		Polygon.prototype.setup3DArrayBuffer = function(gl, x, y){

			var vBuffer, vertices = [], i;

			var vBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

			for(i = 0; i < this.triangles.length; i++){
				vertices.push(this.triangles[i][0][0]);
				vertices.push(this.triangles[i][0][1]);
				vertices.push(0.0);
				vertices.push(this.triangles[i][1][0]);
				vertices.push(this.triangles[i][1][1]);
				vertices.push(0.0);
				vertices.push(this.triangles[i][2][0]);
				vertices.push(this.triangles[i][2][1]);
				vertices.push(0.0);
			}

			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
			vBuffer.itemSize = 3;
			vBuffer.numItems = this.triangles.length * 3;
			this.vertexBuffer = vBuffer;

		};

		return Polygon;

	}
);