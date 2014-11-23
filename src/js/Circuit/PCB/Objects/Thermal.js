define(
	function(){

		var Thermal = function(layerNumber, type){

			this.layerNumber = layerNumber;
			this.type = type;

		};

		Thermal.space = 0.5;

		Thermal._clearArc = function(gl, shaderProgram, pointBuffer, ang1, ang2, shave, outerDiameter, innerDiameter, clearance){


			gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pointBuffer.itemSize, gl.FLOAT, false, 0, 0);

			gl.uniform1f(shaderProgram.roundPointsUniform, true);
			gl.uniform1f(shaderProgram.arcEnabledUniform, true);
			gl.uniform1f(shaderProgram.innerRadiusUniform, innerDiameter / outerDiameter / 2);
			gl.uniform1f(shaderProgram.pointsizeUniform, outerDiameter * gl.scaleFactor);
			gl.uniform1f(shaderProgram.startAngleUniform, ang1 + ang2);
			gl.uniform1f(shaderProgram.sweepUniform, Math.PI / 2 - ang2 * 2);
			if(shave)
				gl.uniform1f(shaderProgram.shaveInsideUniform, clearance / outerDiameter * Thermal.space / 2);

			gl.drawArrays(gl.POINTS, 0, pointBuffer.numItems);

			gl.uniform1f(shaderProgram.roundPointsUniform, false);
			gl.uniform1f(shaderProgram.arcEnabledUniform, false);
			gl.uniform1f(shaderProgram.shaveInsideUniform, 0.0);

		};

		Thermal.prototype._createCache = function(gl, x, y, angleOffset, angle, radius){

			var pointBuffer, points, angle2;

			angle2 = Math.PI * 0.5 + angle + angleOffset;
			angle += angleOffset;
			points = [
			 x + radius * Math.cos(angle), y + radius * Math.sin(angle), 0,
			 x - radius * Math.cos(angle), y + radius * Math.sin(angle), 0,
			 x + radius * Math.cos(angle), y - radius * Math.sin(angle), 0,
			 x - radius * Math.cos(angle), y - radius * Math.sin(angle), 0,
			 x + radius * Math.cos(angle2), y + radius * Math.sin(angle2), 0,
			 x - radius * Math.cos(angle2), y + radius * Math.sin(angle2), 0,
			 x + radius * Math.cos(angle2), y - radius * Math.sin(angle2), 0,
			 x - radius * Math.cos(angle2), y - radius * Math.sin(angle2), 0,
		    ];

			pointBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
			pointBuffer.itemSize = 3;
			pointBuffer.numItems = 8;
			this.pointBuffer = pointBuffer;

		};

		Thermal.prototype._clearPoints = function(gl, shaderProgram, clearance){

			gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.pointBuffer.itemSize, gl.FLOAT, false, 0, 0);
			gl.uniform1f(shaderProgram.roundPointsUniform, true);
			gl.uniform1f(shaderProgram.innerRadiusUniform, 0.0);
			gl.uniform1f(shaderProgram.pointsizeUniform, (clearance / 2) * gl.scaleFactor);
			gl.drawArrays(gl.POINTS, 0, this.pointBuffer.numItems);
			gl.uniform1f(shaderProgram.roundPointsUniform, false);

		};

		Thermal.findThermal = function(list, layerNumber){
			for(var i = 0; i < list.length; i++)
				if(list[i].onLayer(layerNumber))
					return list[i];
			return null;
		};

		Thermal.prototype.onLayer = function(layerNumber){
			return this.layerNumber == layerNumber - 1;
		};

		Thermal.prototype.clear = function(ctx, x, y, clearance, outerDiameter, innerDiameter){
			switch(this.type){
				case 'S':
					break;
				case 't':
					var radius = ((clearance / 2) + outerDiameter) / 2;
					var clearanceAngle = clearance / radius / 2;

					ctx.lineCap = 'round';
					ctx.lineWidth = clearance / 2;
					ctx.beginPath();
					ctx.arc(x, y, radius, -clearanceAngle, -Math.PI * 0.5 + clearanceAngle, true);
					ctx.stroke();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 0.5 - clearanceAngle, -Math.PI * 1.0 + clearanceAngle, true);
					ctx.stroke();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 1.0 - clearanceAngle, -Math.PI * 1.5 + clearanceAngle, true);
					ctx.stroke();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 1.5 - clearanceAngle, -Math.PI * 2.0 + clearanceAngle, true);
					ctx.stroke();
					break;
				case 'X':
					var radius = ((clearance / 2) + outerDiameter) / 2;
					var clearanceAngle = clearance / radius / 2;

					ctx.lineCap = 'round';
					ctx.lineWidth = clearance / 2;
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 0.25 - clearanceAngle, -Math.PI * 0.75 + clearanceAngle, true);
					ctx.stroke();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 0.75 - clearanceAngle, -Math.PI * 1.25 + clearanceAngle, true);
					ctx.stroke();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 1.25 - clearanceAngle, -Math.PI * 1.75 + clearanceAngle, true);
					ctx.stroke();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 1.75 - clearanceAngle, -Math.PI * 2.25 + clearanceAngle, true);
					ctx.stroke();
					break;
				case '+':
					var radius = (clearance + outerDiameter) / 2;
					var clearanceAngle = clearance / radius / 4;
					var clearanceAngle2 = clearance / outerDiameter / 2;
					ctx.beginPath();
					ctx.arc(x, y, radius, - clearanceAngle, -Math.PI * 0.5 + clearanceAngle, true);
					ctx.arc(x, y, outerDiameter / 2, -Math.PI * 0.5 + clearanceAngle2, - clearanceAngle2, false);
					ctx.closePath();
					ctx.fill();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 0.5 - clearanceAngle, -Math.PI * 1.0 + clearanceAngle, true);
					ctx.arc(x, y, outerDiameter / 2, -Math.PI * 1.0 + clearanceAngle2, -Math.PI * 0.5 - clearanceAngle2, false);
					ctx.closePath();
					ctx.fill();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 1.0 - clearanceAngle, -Math.PI * 1.5 + clearanceAngle, true);
					ctx.arc(x, y, outerDiameter / 2, -Math.PI * 1.5 + clearanceAngle2, -Math.PI * 1.0 - clearanceAngle2, false);
					ctx.closePath();
					ctx.fill();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 1.5 - clearanceAngle, -Math.PI * 2.0 + clearanceAngle, true);
					ctx.arc(x, y, outerDiameter / 2, -Math.PI * 2.0 + clearanceAngle2, -Math.PI * 1.5 - clearanceAngle2, false);
					ctx.closePath();
					ctx.fill();
					break;
				case 'O':
					var radius = (clearance + outerDiameter) / 2;
					var clearanceAngle = clearance / radius / 4;
					var clearanceAngle2 = clearance / outerDiameter / 2;
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 0.25 - clearanceAngle, -Math.PI * 0.75 + clearanceAngle, true);
					ctx.arc(x, y, outerDiameter / 2, -Math.PI * 0.75 + clearanceAngle2, -Math.PI * 0.25 - clearanceAngle2, false);
					ctx.closePath();
					ctx.fill();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 0.75 - clearanceAngle, -Math.PI * 1.25 + clearanceAngle, true);
					ctx.arc(x, y, outerDiameter / 2, -Math.PI * 1.25 + clearanceAngle2, -Math.PI * 0.75 - clearanceAngle2, false);
					ctx.closePath();
					ctx.fill();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 1.25 - clearanceAngle, -Math.PI * 1.75 + clearanceAngle, true);
					ctx.arc(x, y, outerDiameter / 2, -Math.PI * 1.75 + clearanceAngle2, -Math.PI * 1.25 - clearanceAngle2, false);
					ctx.closePath();
					ctx.fill();
					ctx.beginPath();
					ctx.arc(x, y, radius, -Math.PI * 1.75 - clearanceAngle, -Math.PI * 2.25 + clearanceAngle, true);
					ctx.arc(x, y, outerDiameter / 2, -Math.PI * 2.25 + clearanceAngle2, -Math.PI * 1.75 - clearanceAngle2, false);
					ctx.closePath();
					ctx.fill();
					break;
				default:
					ctx.beginPath();
					ctx.arc(x, y, (clearance + outerDiameter) / 2, 0, Math.PI * 2, true);
					ctx.closePath();
					ctx.fill();
					break;
			}

		};

		Thermal.prototype.clearGL = function(gl, shaderProgram, x, y, pointBuffer, clearance, outerDiameter, innerDiameter){
			switch(this.type){
				case 'S':
					break;
				case 't':
					var clearanceAngle = clearance / ((clearance / 2 + outerDiameter) / 2) * Thermal.space;
					if(!this.pointBuffer) this._createCache(gl, x, y, 0, clearanceAngle, ((clearance / 2) + outerDiameter) / 2);
					this._clearPoints(gl, shaderProgram, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, 0            , clearanceAngle, false, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI * 0.5, clearanceAngle, false, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer,-Math.PI * 0.5, clearanceAngle, false, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer,-Math.PI      , clearanceAngle, false, outerDiameter + clearance, outerDiameter, clearance);
					break;
				case 'X':
					var clearanceAngle = clearance / ((clearance / 2 + outerDiameter) / 2) * Thermal.space;
					if(!this.pointBuffer) this._createCache(gl, x, y, Math.PI * 0.25, clearanceAngle, ((clearance / 2) + outerDiameter) / 2);
					this._clearPoints(gl, shaderProgram, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI * 0.25, clearanceAngle, false, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer,-Math.PI * 0.25, clearanceAngle, false, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI * 0.75, clearanceAngle, false, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer,-Math.PI * 0.75, clearanceAngle, false, outerDiameter + clearance, outerDiameter, clearance);
					break;
				case '+':
					var clearanceAngle = clearance / ((clearance + outerDiameter) / 2) / 4;
					Thermal._clearArc(gl, shaderProgram, pointBuffer, 0            , clearanceAngle, true, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI * 0.5, clearanceAngle, true, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI      , clearanceAngle, true, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI * 1.5, clearanceAngle, true, outerDiameter + clearance, outerDiameter, clearance);
					break;
				case 'O':
					var clearanceAngle = clearance / ((clearance + outerDiameter) / 2) / 4;
					gl.uniform1f(shaderProgram.shaveFFUniform, true);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI * 0.25, clearanceAngle, true, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI * 0.75, clearanceAngle, true, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI * 1.25, clearanceAngle, true, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI * 1.75, clearanceAngle, true, outerDiameter + clearance, outerDiameter, clearance);
					gl.uniform1f(shaderProgram.shaveFFUniform, false);
					break;
				default:
					break;
			}
		};

		return Thermal;

	}
);