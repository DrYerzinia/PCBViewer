requirejs.config({

	baseUrl: 'js',
	paths: {
		shaders: '../data/shaders',
	}

});

require(['circuit/PCB/PCBViewer'], function(PCBV){

	var PCBListSelect, PCBListReq, PCBCanvasContainer, status;

	window.PCBViewer = {};

	PCBListSelect = document.getElementById("samplePCBs");
	PCBCanvasContainer = document.getElementById("PCB-canvas-container");
	status = document.getElementById("Status");

	window.onresize = function(e){

		if(window.PCBViewer.canvas){

			window.PCBViewer.canvas.width = window.innerWidth-20;
			window.PCBViewer.canvas.height = window.innerHeight-50;

			window.PCBViewer.pcb.resize();
			window.PCBViewer.pcb.render(true);

		}

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

			var pcb = window.PCBViewer.pcb;

			if(pcb){
				pcb.destroy();
				pcb = null;
			}

			var mode = document.querySelector('input[name="mode"]:checked').value;

			PCBCanvasContainer.innerHTML = '<canvas id="pcbcan" width="800" height="600" tabindex="1"></canvas>';

			window.PCBViewer.canvas = document.getElementById('pcbcan');

			window.PCBViewer.canvas.width = window.innerWidth-20;
			window.PCBViewer.canvas.height = window.innerHeight-50;

			pcb = new PCBV(window.PCBViewer.canvas, true, mode);
			window.PCBViewer.pcb = pcb;
			pcb.parse(PCBLoadReq.response);
			pcb.setup();
			pcb.render();

			status.innerHTML = window.PCBViewer.pcb.mode;

		};

		PCBLoadReq.send();

	};

});