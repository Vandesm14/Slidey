const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let pins = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/remote', (req, res) => {
	res.sendFile(__dirname + '/public/remote.html');
});

app.post('/verify', (req, res) => {
	let pin = req.body.pin;
	let key = pins.find(el => el.pin === pin);
	if (key) {
		pins.splice(pins.indexOf(pin), 1);
	}
	res.send(key.pin);
});

app.post('/otp', (req, res) => {
	let pin = otp();
	let key = req.body.key;
	pins.push({pin, key});
	res.send(pin);
});

app.use(express.static('public'));
http.listen(3000, () => console.log('server started'));

io.on('connection', (socket) => {
	socket.on('init', (data) => {
		socket.join(data.id);
	});

	socket.on('control', (data) => {
		socket.to(data.id).emit('control', data);
	});

	socket.on('slides', (data) => {
		socket.to(data.id).emit('slides', data);
	});

	socket.on('remote', (data) => {
		socket.to(data.id).emit('remote', data);
	});

	socket.on('info', (data) => {
		socket.to(data.id).emit('info', data);
	});
});

function uuid4() {
	var dt = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (dt + Math.random() * 16) % 16 | 0;
		dt = Math.floor(dt / 16);
		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
	return uuid;
}

function otp() {
	let pin = ''
	for (let i in '0'.repeat(6)) {
		pin += Math.floor(Math.random() * 10);
	}
	return pin;
}