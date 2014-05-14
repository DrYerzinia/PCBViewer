requirejs.config({

	baseUrl: 'js',

});

require(['circuit/PCBViewer'], function(PCBV){

	window.PCBViewer = {};

	window.PCBViewer.canvas = document.getElementById('pcbcan');

	window.PCBViewer.canvas.width = window.innerWidth-20;
	window.PCBViewer.canvas.height = window.innerHeight-50;

	window.onresize = function(e){

		window.PCBViewer.canvas.width = window.innerWidth-20;
		window.PCBViewer.canvas.height = window.innerHeight-50;

		window.PCBViewer.pcb.resize();
		window.PCBViewer.pcb.render(true);

	};

	document.getElementById('load').onclick = function(){

		new_sym_req = new XMLHttpRequest();
		new_sym_req.open('GET', document.getElementById('pcburl').value);
		new_sym_req.responseType = 'text';

		new_sym_req.onload = function(){

			window.PCBViewer.pcb = new PCBV(window.PCBViewer.canvas, true);
			window.PCBViewer.pcb.parse_data(new_sym_req.response);
			window.PCBViewer.pcb.render();

		};

		new_sym_req.send();

	};

});