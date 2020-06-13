const socket = io();
const render = (text) => {
	return markdownit({
		breaks: true
	}).render(text);
};

var id = '';
const storedid = localStorage.getItem('remoteid');
if (storedid) {
	id = storedid;
} else {
	id = uuid4();
	localStorage.setItem('remoteid', id);
}
socket.emit('init', {
	id
});

socket.on('remote', function (data) {
	switch (data.cmd) {
		case 'prev':
			slide = slide - 1 < 0 ? 0 : slide - 1;
			setFrame();
			break;
		case 'next':
			slide = slide + 1 >= cards.length ? cards.length - 1 : slide + 1;
			setFrame();
			break;
		case 'start':
			if (slide === 0) return;
			slide = 0;
			setFrame(true);
			break;
		case 'end':
			if (slide === cards.length - 1) return;
			slide = cards.length - 1;
			setFrame(true);
			break;
		case 'theme':
			theme = (theme + 1) % 3;
			version++;
			$(this).text(['Colors', 'White', 'Black'][theme]);
			updateFrames();
			setFrame(true);
			break;
		case 'init':
			console.log('init');
			socket.emit('info', {
				id,
				str: `${(slide + 1)} of ${cards.length}`
			});
	}
});

socket.on('slides', function (data) {
	sendFrames(data.override);
});

socket.on('control', function (data) {
	if (slide === data.slide) return;
	slide = data.slide;
	if (slide - 1 === lastSlide || slide + 1 === lastSlide) {
		setFrame();
	} else {
		setFrame(true);
	}
});

var cards = [];
var tiles = [];
var groups = [];
var colors = ['red', 'orange', 'green', 'cyan', 'blue', 'purple'];

var version = 0;
var prevVersion = 0;

var theme = 0;
var viewMode = false;
var slide = 0;
var lastSlide = -1;
var slideKeys = '';

var slideBack = ['ArrowDown', 'ArrowLeft', 'Backspace'];
var slideForward = ['ArrowUp', 'ArrowRight', ' ', 'Enter'];

var vw = $(window).width();
var vh = $(window).height();

$(document).ready(function () {
	updateCards();

	$('#upload').on('change', function (e) {
		let file = e.target.files[0];
		let reader = new FileReader();
		reader.readAsText(file);
		reader.addEventListener('load', (e) => {
			let text = e.target.result;
			if (text) {
				cards = JSON.parse(text);
			}
			let preGroups = cards.map(el => el.group)
			groups = preGroups.filter((el, i) => preGroups.indexOf(el) === i);
			fromCards();
		});
	});

	$('.header .button-side').on('click', function () {
		$('.side').toggleClass('open');
		$('.editor > .row > .col').toggleClass('open');
	});
	$('.header .button-upload').on('click', function () {
		if (cards.some(el => el.text)) {
			if (!confirm('Overwrite current presentation?')) return;
		}
		$('#upload').click();
	});
	$('.header .button-download').on('click', function () {
		let file = new Blob([JSON.stringify(cards)], {
			type: 'text/plain;charset=utf-8'
		});
		saveAs(file, 'untitled.slidey');
	});
	$('.header .button-remote').on('click', function () {
		open(`remote?id=${id}`);
	});
	$('.header .button-view').on('click', function (e) {
		e.stopPropagation();
		viewMode = !viewMode;
		slide = 0;
		setFrame(true);
		switchView();
		document.documentElement.requestFullscreen();
	});
	$('.header .button-theme').on('click', function () {
		theme = (theme + 1) % 3;
		version++;
		$(this).text(['Colors', 'White', 'Black'][theme]);
		updateFrames();
		setFrame(true);
	});
	$('.header .button-clearAll').on('click', function () {
		if (!confirm('Clear All Slides?')) return;
		cards = [];
		$('#list').empty();
		updateCards();
	});
	$('.header .button-clearEmpty').on('click', function () {
		cards = cards.filter(el => el.text);
		fromCards();
	});

	$(document)[0].addEventListener('keydown', function (e) { // Global functions
		if (e.key === 'Escape') {
			viewMode = !viewMode;
			switchView();
			setFrame(true);
			document.documentElement.requestFullscreen();
		} else if (e.key === 'Tab' && viewMode) {
			e.preventDefault();
			theme = (theme + 1) % 3;
			version++;
			$('.header .button-theme').text(['Colors', 'White', 'Black'][theme]);
			updateFrames();
			setFrame(true);
		}
	});

	$(document).on('keydown', function (e) { // View-sepecific functions
		let step = false;
		if (viewMode) {
			if (slideBack.includes(e.key)) {
				slide = slide - 1 < 0 ? 0 : slide - 1;
			} else if (slideForward.includes(e.key)) {
				slide = slide + 1 >= cards.length ? cards.length - 1 : slide + 1;
			} else if (e.key === 'Home') {
				step = true;
				slide = 0;
			} else if (e.key === 'End') {
				step = true;
				slide = cards.length - 1;
			} else if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(e.key)) {
				slideKeys += e.key;
				if (+slideKeys > cards.length) slideKeys = '' + cards.length;
				return;
			}
			setFrame(step);
		}
	});

	$(document).on('click', function () {
		if (viewMode) {
			slide = slide + 1 >= cards.length ? cards.length - 1 : slide + 1;
			setFrame();
		}
	});

	$(document).on('contextmenu', function (e) {
		if (viewMode) {
			e.preventDefault();
			slide = slide - 1 < 0 ? 0 : slide - 1;
			setFrame();
		}
	});

	$(window).on('resize', function () {
		vw = $(window).width();
		version++;
		updateFrames();
		setFrame(true);
	});

	$(document).on('fullscreenchange', function (e) {
		if (!document.fullscreenElement && viewMode) {
			viewMode = false;
			switchView();
		}
	});
});

function updateCards() {
	if ($('#list').children().length === 0) {
		let template = $('#cardTemplate').html();
		$('#list').append(template);
	}
	$('#list > .card').each(function (el) {
		$(this).find('.card-id').text($(this).index() + 1);
		$(this).find('.text').attr('class', 'text');
		$(this).find('.text').addClass($(this).find('.button-position > img').attr('src').match(/pos-[0-9]+/)[0]);
	});
	$('.text').css('height', '44px');
	$('.text').each(function () {
		$(this).css('height', $(this)[0].scrollHeight + 'px');
	});
	calcListeners();
	calcCards();
	createSortable($('#list')[0]);
	$('#info-total').text(cards.length === 1 ? '1 Slide' : cards.length + ' Slides');
}

function calcListeners() {
	$('.card-id').off('click');
	$('.card-id').on('click', function (e) {
		e.stopPropagation();
		slide = $(this).closest('.card').index();
		setFrame(true);
		viewMode = true;
		switchView();
	});

	$('.button-add').off('click');
	$('.button-add').on('click', function () {
		let template = $('#cardTemplate').html();
		$(this).closest('.card').after(template);
		updateCards();
	});

	$('.button-remove').off('click');
	$('.button-remove').on('click', function () {
		$(this).closest('.card').remove();
		updateCards();
	});

	$('.text').off('keyup');
	$('.text').on('keyup', function () {
		$(this).css('height', '44px');
		$(this).css('height', $(this)[0].scrollHeight + 'px');
		calcCards();
	});
	$('.text').off('keydown');
	$('.text').on('keydown', function (e) {
		if (e.key === 'Enter' && e.shiftKey) {
			e.preventDefault();
			let template = $('#cardTemplate').html();
			$(this).closest('.card').after(template);
			$(this).closest('.card').next().find('.text').focus();
			updateCards();
		}
	});

	$('.button-position').off('click');
	$('.button-position').on('click', function () {
		let img = $(this).find('img');
		let pos = img.attr('src');
		img.attr('src', `icons/pos-${(pos.match(/[0-9]+/)[0]+1) % 9}.png`);
		updateCards();
	});
}

function calcCards() {
	cards = [];
	version++;
	$('.card').each(function (el) {
		cards.push({
			text: $(this).find('.text').val(),
			pos: $(this).find('.button-position > img').attr('src').match(/pos-[0-9]+/)[0],
			id: uuid4()
		});
	});
	socket.emit('info', {
		id,
		str: `${(slide + 1)} of ${cards.length}`
	});
}

function fromCards() {
	$('#list').empty();
	for (let card of cards) {
		let template = $('#cardTemplate').html();
		$('#list').append(template);
		$('.card:last-child').find('.text').val(card.text);
		$('.card:last-child').find('.button-position > img').attr('src', `icons/${card.pos}.png`);
	}
	updateCards();
}

function switchView() {
	if (viewMode) {
		$('#viewer').show();
		$('#editor').hide();
		updateFrames();
	} else {
		document.exitFullscreen();
		$('#editor').show();
		if (slide > 1) {
			$('#editor').scrollTo(`.card:eq(${slide})`, 500);
		} else {
			$('#editor').scrollTo(0, 500);
		}
		$('#viewer').hide();
	}
}

function setFrame(override = false) {
	if (slideKeys) {
		if (+slideKeys === 0) slideKeys = '1';
		slide = +slideKeys - 1;
		override = true;
		slideKeys = '';
		if (+slideKeys === lastSlide) return;
	}
	if (lastSlide === slide && !override) return;
	if (override || theme) {
		$('#viewer').stop(true, true);
		$('.show').removeClass('show');
		setTimeout(function () {
			$('#viewer').css('margin-left', -vw * slide);
			$('.viewer > .frame').eq(slide).addClass('show');
		}, 200);
	} else {
		$('#viewer').stop(true, true);
		$('#viewer').animate({
			marginLeft: -vw * slide
		}, 300);
		$('.show').removeClass('show');
		$('.viewer > .frame').eq(slide).addClass('show');
	}
	socket.emit('info', {
		id,
		str: `${(slide + 1)} of ${cards.length}`
	});
	lastSlide = slide;
}

function updateFrames() {
	$('#viewer').empty();
	for (let i in cards) {
		let pos = +cards[i].pos.split('-')[1];
		$('#viewer').append(`<div class="frame ${colors[i % colors.length]}"><div class="content">${render(cards[i].text)}</div></div>`);
		$('#viewer > .frame').eq(i).addClass(cards[i].pos);

		// $('#list > .card').eq(i).find('.card-id')
		// .attr('class', 'card-id ' + colors[i % colors.length]);
	}
	$('#viewer > .frame > .content > p:only-child > img:only-child').parent().addClass('image-only');
	$('#viewer > .frame > .content > p > img:only-child').parent().addClass('has-image');
	$('#viewer > .frame').each(function (i) {
		if ($(this).find('.content > p.has-image').length) {
			$(this).addClass('has-image');
			$(this).append('<div class="image"></div>');
			$(this).find('.content > p.has-image').each(function () {
				let image = $(this).parent().parent().find('.image');
				$(this).detach().appendTo(image);
			});
		}
		let maxlines = Math.round(vh / lineHeight(this));
		let lines = getLines($(this).find('.content'));
		if ($(this).is('.pos-2.has-image, .pos-6.has-image')) lines += getLines($(this).find('.image'));
		if (lines > maxlines) {
			$(this).css('font-size', `${36*(maxlines / lines)}px`);
		}
	});
	if (theme) {
		for (let color of colors) {
			$(`.frame.${color}`).removeClass(color);
		}
	}
	if (theme === 1) {
		$('#viewer').addClass('invert');
	} else {
		$('#viewer').removeClass('invert');
	}
	sendFrames();
}

function createSortable(el) {
	Sortable.create(el, {
		animation: 150,
		invertSwap: true,
		handle: '.card-id',
		// filter: '.text',
		onEnd: updateCards
	});
}

function getLines(elem) {
	let divheight = $(elem).actual('height');
	let lineheight = lineHeight(elem);
	return Math.ceil(divheight / lineheight);
}

function lineHeight(elem) {
	return Math.floor(parseInt($(elem).css('font-size').replace('px', '')) * 1.5) + 10;
}

function uuid4() {
	var dt = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (dt + Math.random() * 16) % 16 | 0;
		dt = Math.floor(dt / 16);
		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
	return uuid;
}

function arrayEqual(arr1, arr2) {
	let eq = true;
	for (let i = 0; i < (arr1.length || arr2.length); i++) {
		if (arr1[i] !== arr2[i]) eq = false;
	}
	return eq;
}

function sendFrames(override = false) {
	socket.emit('event', {id, event: 'frames', status: 'pending'});
	let cache = version;
	if (version === prevVersion && !override) {
		socket.emit('slides', {
			id,
			tiles
		});
		console.log('sent cache');
		return;
	}
	if (viewMode) {
		let arr = [];
		$('.frame > *').css('opacity', '1');
		setTimeout(function () {
			$('.frame').each(async function (i) {
				let elem = $(this)[0];
				if (version !== cache) return;
				let canvas = await html2canvas(elem);
				arr[i] = {
					tile: canvas.toDataURL(),
					id: cards[i].id
				};
				if (i === cards.length - 1) done();
			});

			function done() {
				$('.frame > *').css('opacity', '');
				if (version !== cache) return;
				if (arrayEqual(arr.map(el => el.id), cards.map(el => el.id))) {
					arr = arr.map(el => el.tile);
					socket.emit('slides', {
						id,
						tiles: arr
					});
					tiles = [...arr];
					prevVersion = version;
					console.log('sent');
				} else {
					console.log('Data error, recalculating...');
					sendFrames(true);
				}
			}
		}, 350);
	}
}