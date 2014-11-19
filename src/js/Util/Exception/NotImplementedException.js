define(
	[
	 	'Util/Exception/Exception',
	 	'Util/Class'
	],
	function(
		Exception,
		Class
	){

	var NotImplementedException = function(message){

		Exception.call(this, message);

	};

	Class.extend(Exception, NotImplementedException);

	NotImplementedException.prototype.className = function(){
		return 'NotImplementedException';
	};

	return NotImplementedException;

});
