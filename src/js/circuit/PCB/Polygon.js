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

		}

		Polygon.prototype.clear = function(triangles){
			
			// Make sure polygon clears input triangles

		}

		Polygon.prototype.renderGL = function(gl, shaderProgram){}
	
		Polygon.prototype.cleanupGL = function(gl){}

		Polygon.prototype.setup3DArrayBuffer = function(gl, x, y){}

		return Polygon;

	}
);