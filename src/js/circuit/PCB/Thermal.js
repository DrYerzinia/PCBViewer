define(
	function(){

		var Thermal = function(layerNumber, type){

			this.layerNumber = layerNumber;
			this.type = type;

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

		Thermal._clearArc = function(gl, shaderProgram, pointBuffer, ang1, ang2, outerDiameter, innerDiameter, clearance){


			gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pointBuffer.itemSize, gl.FLOAT, false, 0, 0);

			gl.uniform1f(shaderProgram.roundPointsUniform, true);
			gl.uniform1f(shaderProgram.arcEnabledUniform, true);
			gl.uniform1f(shaderProgram.innerRadiusUniform, innerDiameter / outerDiameter / 2);
			gl.uniform1f(shaderProgram.pointsizeUniform, outerDiameter * gl.scaleFactor);
			gl.uniform1f(shaderProgram.startAngleUniform, ang1 + ang2);
			gl.uniform1f(shaderProgram.sweepUniform, Math.PI / 2 - ang2 * 2);
			gl.uniform1f(shaderProgram.shaveInsideUniform, clearance / outerDiameter / 4);
			gl.drawArrays(gl.POINTS, 0, pointBuffer.numItems);

			gl.uniform1f(shaderProgram.roundPointsUniform, false);
			gl.uniform1f(shaderProgram.roundPointsUniform, false);
			gl.uniform1f(shaderProgram.arcEnabledUniform, false);
			gl.uniform1f(shaderProgram.shaveInsideUniform, 0.0);

		};

		Thermal.prototype.clearGL = function(gl, shaderProgram, pointBuffer, clearance, outerDiameter, innerDiameter){
			switch(this.type){
				case 'S':
					break;
				case 't':
					break;
				case 'X':
					break;
				case '+':
					var radius = (clearance + outerDiameter) / 2;
					var clearanceAngle = clearance / radius / 4;
					Thermal._clearArc(gl, shaderProgram, pointBuffer, 0, clearanceAngle, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI * 0.5, clearanceAngle, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI, clearanceAngle, outerDiameter + clearance, outerDiameter, clearance);
					Thermal._clearArc(gl, shaderProgram, pointBuffer, Math.PI * 1.5, clearanceAngle, outerDiameter + clearance, outerDiameter, clearance);
					break;
				case 'O':
					break;
				default:
					break;
			}
		};

		return Thermal;

	}
);