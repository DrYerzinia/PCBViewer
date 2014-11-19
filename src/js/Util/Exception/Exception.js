define(
	function(){

		var Exception = function(message){

			this.message = message;

		};

		Exception.prototype.className = function(){

			return 'Exception';

		}

		Exception.prototype.toString = function(){

			return this.className() + ": " + this.message;

		}

		return Exception;

	}
);