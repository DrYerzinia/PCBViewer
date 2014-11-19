define(
	[
	 	'Util/Exception/Exception'
	],
	function(
		Exception
	){

		var Class = {};

		Class.registrationList = {};

		Class.extend = function(superClass, subClass){

			subClass.prototype = new superClass();
			subClass.prototype.constructor = subClass;
			subClass.superClass = superClass;

		};

		Class.register = function(clas){

			var name = clas.prototype.className();

			if(Class.registrationList[name] !== undefined)
				throw  new Exception("Class already registered!");

			Class.registrationList[name] = clas;

		};

		Class.getRegisteredClassByName = function(name){

			var clas = Class.registrationList[name];

			if(clas === undefined)
				throw new Exception("Class \'" + name + "\' not registered!");

			return clas;

		};

		Class.isChild = function(parentType, childObject){

			var proto = childObject;

			while(proto != null){

				if(proto instanceof parentType)
					return true;

				proto = proto.__proto__;

			}

			return false;

		};

		return Class;
 
	}
);