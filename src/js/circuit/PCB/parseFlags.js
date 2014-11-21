define(function(){

	var parseFlags = function(defaultFlags, flags){

		if(!flags) return {};

		var parsedFlags, split, parts, flag, attr, thrm, i, j, k;

		split = flags.split("\(.*?\)|(,)");

		parsedFlags = {};

		for(attr in defaultFlags)
            if(obj.hasOwnProperty(attr))
            	parsedFlags[attr] = obj[attr];

		for(i = 0; i < split.length; i++){

			flag = split[i];

			if(flag.indexOf("thermal") == 0){

				thrm = [];

				flag = flag.split('(')[1].split(')')[0].split(',');
				for(j = 0; j < flag.length; j++){
					// check for #-#
					// for each add layer
					//else layer #
					parts = flag[j].split('-');
					if(parts.length == 2){
						parts = flag[j][flag[j].length-1];
						if(isNaN(parseInt(parts))){
							parts = flag[j].substring(0, flag[j].length - 1).split('-');
							attr = parts;
						} else {
							parts = flag[j].split('-');
							attr = 'O';
						}
						
						for(k = parseInt(parts[0]); k <= parseInt(parts[1]); k++){
							thrm.push({number: k, type: attr});
						}
					} else {
						parts = flag[j][flag[j].length-1];
						if(isNaN(parseInt(parts)))
							thrm.push({number: parseInt(flag[j].substring(0, flag[j].length - 1)), type: parts});
						else
							thrm.push({number: parseInt(flag[j].substring(0, flag[j].length)), type: 'O'});
					}
				}
				parsedFlags.thermal = thrm;
			}
			else
				parsedFlags[flag] = true;

		}

		return parsedFlags;

	};

	return parseFlags;

});