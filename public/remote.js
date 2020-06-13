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
var lastSlide = -1;

var status = '';

var slideBack = ['ArrowDown', 'ArrowLeft', 'Backspace'];
var slideForward = ['ArrowUp', 'ArrowRight', ' ', 'Enter'];
var slideKeys = '';

var viewMode = !!window.location.href.match(/\?m=tiles/g);
switchView();
setZoom(localStorage.getItem('zoom') || 5);

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
	$('.range-zoom').on('input', function () {
		setZoom($(this).val());
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

	$(document).on('keydown', function (e) { // View-sepecific functions
		if (viewMode) {
			if (slideBack.includes(e.key)) {
				slide = slide - 1 < 0 ? 0 : slide - 1;
			} else if (slideForward.includes(e.key)) {
				slide = slide + 1 >= tiles.length ? tiles.length - 1 : slide + 1;
			} else if (e.key === 'Home') {
				slide = 0;
			} else if (e.key === 'End') {
				slide = tiles.length - 1;
			} else if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(e.key)) {
				slideKeys += e.key;
				if (+slideKeys > tiles.length) slideKeys = '' + tiles.length;
				return;
			}
			if (slideKeys) {
				if (+slideKeys === 0) slideKeys = '1';
				slide = +slideKeys - 1;
				override = true;
				slideKeys = '';
				if (+slideKeys === lastSlide) return;
			}
			if (slide === lastSlide) return;
			setStatus(true);
			socket.emit('control', {
				id,
				slide
			});
			lastSlide = slide;
		}
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

function setZoom(zoom) {
	if ($('.range-zoom').css('display') === 'none') return;
	localStorage.setItem('zoom', zoom);
	$('.range-zoom').val(zoom);
	$('#list').attr('class', 'list z' + zoom);
}