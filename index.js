const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/remote', (req, res) => {
	res.sendFile(__dirname + '/public/remote.html');
});

app.use(express.static('public'));
http.listen(3000, () => console.log('server started'));

io.on('connection', (socket) => {
	socket.on('init', (data) => {
		console.log(socket.id, data.id);
		socket.join(data.id);
	});

	socket.on('send', (data) => {
		console.log(socket.id, data);
		socket.to(data.id).emit('send', data);
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