const socket = io();

var id = location.href.match(/\?id=[\w\d]{8}-[\w\d]{4}-[\w\d]{4}-[\w\d]{4}-[\w\d]{12}/);
const storedid = localStorage.getItem('remoteid');
if (id) {
	id = id[0].substr(4);
	localStorage.setItem('remoteid', id);
	window.history.pushState({}, document.title, window.location.href.replace(window.location.search, ''));
} else if (storedid) {
	id = storedid;
}
setStatus(true);
socket.emit('init', {
	id
});
socket.emit('remote', {
	id,
	cmd: 'init'
});
socket.emit('slides', {
	id
});

socket.on('info', function (data) {
	slide = +data.str.split(' ')[0] - 1;
	slides = +data.str.split(' ')[2];
	$('.info').text('Slide ' + data.str);
	
	$('.active').removeClass('active');
	$('.tile').eq(slide).addClass('active');
	setStatus();
});

socket.on('slides', function (data) {
	if (!data.tiles) return; // Ignore get-slide requests
	if (data.tiles.length !== slides) {
		console.log('Data error, resyncing tiles...');
		socket.emit('slides', {
			id
		});
		return;
	}
	tiles = data.tiles;
	updateTiles();
});

var tiles = [];
var slide = 0;
var slides = 1;

var viewMode = !!window.location.href.match(/\?m=tiles/g);
switchView();

$(document).ready(function () {
	$('.button-switchView').on('click', function () {
		viewMode = !viewMode;
		switchView();
	});
	$('.button-theme').on('click', function () {
		setStatus(true);
		socket.emit('remote', {
			id,
			cmd: 'theme'
		});
	});
	$('.button-refresh').on('click', function () {
		setStatus(true);
		socket.emit('slides', {
			id,
			override: true
		});
	});

	$('.remote .button-prev').on('click', function () {
		socket.emit('remote', {
			id,
			cmd: 'prev'
		});
	});
	$('.remote .button-next').on('click', function () {
		socket.emit('remote', {
			id,
			cmd: 'next'
		});
	});
	$('.remote .button-start').on('click', function () {
		socket.emit('remote', {
			id,
			cmd: 'start'
		});
	});
	$('.remote .button-end').on('click', function () {
		socket.emit('remote', {
			id,
			cmd: 'end'
		});
	});
});

function switchView() {
	if (viewMode) {
		$('#gallery').show();
		$('#remote').hide();
		updateTiles();
		window.history.pushState({}, document.title, window.location.origin + '/remote?m=tiles', '');
	} else {
		$('#remote').show();
		$('#gallery').hide();
		window.history.pushState({}, document.title, window.location.origin + '/remote', '');
	}
}

function updateTiles() {
	$('#list').empty();
	for (let i in tiles) {
		$('#list').append(`<div class="tile"><img src="${tiles[i]}"><p>${+i + 1}</p></div>`);
	}
	calcListeners();
	
	$('.active').removeClass('active');
	$('.tile').eq(slide).addClass('active');
	setStatus();
}

function calcListeners() {
	$('.tile').off('click');
	$('.tile').on('click', function () {
		setStatus(true);
		socket.emit('control', {
			id,
			slide: $(this).index()
		});
	});
}

function setStatus(status = false) {
	$('#status').text(status ? 'Working...' : 'Done');
}