define(
	[
	 	'./ElementLine',
	 	'Util/Class'
	],
	function(
		ElementLine,
		Class
	){

		var Line = function(x1, y1, x2, y2, thick, notsure, notsure2){
	
			ElementLine.call(this, x1, y1, x2, y2, thick);
			
		};
	
		Class.extend(ElementLine, Line);
	
		return Line;

	}
);