const socket = io.connect('https://Socketio--vandesm14.repl.co');

var id = location.href.match(/\?id=[\w\d]{8}-[\w\d]{4}-[\w\d]{4}-[\w\d]{4}-[\w\d]{12}/);
const storedid = localStorage.getItem('remoteid');
if (id) {
	id = id[0].substr(4);
	localStorage.setItem('remoteid', id);
	window.history.replaceState({}, document.title, window.location.href.replace(window.location.search, ''));
} else if (storedid) {
	id = storedid;
}
socket.emit('init', {id});

socket.on('send', function(data){
	$('.info').text('Slide ' + data.str);
});

$(document).ready(function () {
	socket.emit('send', {id, cmd: 'init'});

	$('.button-prev').on('click', function () {
		socket.emit('send', {id, cmd: 'prev'});
	});
	$('.button-next').on('click', function () {
		socket.emit('send', {id, cmd: 'next'});
	});
	$('.button-start').on('click', function () {
		socket.emit('send', {id, cmd: 'start'});
	});
	$('.button-end').on('click', function () {
		socket.emit('send', {id, cmd: 'end'});
	});
	$('.button-theme').on('click', function () {
		socket.emit('send', {id, cmd: 'theme'});
	});
});