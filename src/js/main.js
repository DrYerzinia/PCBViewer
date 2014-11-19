requirejs.config({

	baseUrl: 'js',

});

require(['circuit/PCB/PCBViewer'], function(PCBV){

	var PCBListSelect, PCBListReq;

	window.PCBViewer = {};

	PCBListSelect = document.getElementById("samplePCBs");

	window.PCBViewer.canvas = document.getElementById('pcbcan');

	window.PCBViewer.canvas.width = window.innerWidth-20;
	window.PCBViewer.canvas.height = window.innerHeight-50;

	window.onresize = function(e){

		window.PCBViewer.canvas.width = window.innerWidth-20;
		window.PCBViewer.canvas.height = window.innerHeight-50;

		window.PCBViewer.pcb.resize();
		window.PCBViewer.pcb.render(true);

	};

	// Create Sample Schematic List
	PCBListReq = new XMLHttpRequest();
	PCBListReq.open('GET', "data/pcb/PCBList.json");
	PCBListReq.responseTyle = 'text';
	PCBListReq.onload = function() {

		var PCBList, i, el, opt;

		PCBList = JSON.parse(PCBListReq.response);

		for (i = 0; i < PCBList.length; i++) {

			var opt = PCBList[i];
			var el = document.createElement("option");
			el.textContent = opt;
			el.value = opt;
			PCBListSelect.appendChild(el);

		}

	};
	PCBListReq.send();

	document.getElementById('load').onclick = function(){

		var PCBLoadReq = new XMLHttpRequest();
		PCBLoadReq.open('GET', "data/pcb/" + PCBListSelect.value);
		PCBLoadReq.responseType = 'text';

		PCBLoadReq.onload = function(){

			if(window.PCBViewer.pcb)
				window.PCBViewer.pcb.destroy();

			window.PCBViewer.pcb = new PCBV(window.PCBViewer.canvas, true);
			window.PCBViewer.pcb.parse_data(PCBLoadReq.response);
			window.PCBViewer.pcb.render();

		};

		PCBLoadReq.send();

	};

});