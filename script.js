const render = (text) => {
	return markdownit({
		breaks: true
	}).render(text);
};

var cards = [];
var backgrounds = [];
var colors = ['red', 'orange', 'green', 'cyan', 'blue', 'purple'];

var theme = 0;
var viewMode = false;
var slide = 0;
var slideKeys = '';

var slideBack = ['ArrowDown', 'ArrowLeft', 'Backspace'];
var slideForward = ['ArrowUp', 'ArrowRight', ' ', 'Enter'];

var vw = $(window).width();
var vh = $(window).height();
var clipboardPerms = false;

$(document).ready(function () {
	updateCards();

	$(document).on('keydown', function (e) {
		if (e.key === 'Escape') {
			viewMode = !viewMode;
			switchView();
		} else if (e.key === 'Tab' && viewMode) {
			e.preventDefault();
			theme = (theme + 1) % 3;
			updateFrames();
		} else if (e.key === 'F2' && !viewMode) {
			if (!clipboardPerms) {
				testPermission();
			}
			navigator.clipboard.readText()
				.then(text => {
					if (text.match('%slide%').length) {
						cards = text.split('\n%%slide%\n').map(el => {
							return {
								text: el
							};
						});
					} else {
						cards = text.split('\n').map(el => {
							return {
								text: el
							};
						});
					}
					fromCards();
				})
				.catch(err => {
					alert('Error pasting item');
				});
		} else if (e.key === 'F3' && !viewMode) {
			e.preventDefault();
			if (!clipboardPerms) {
				testPermission();
			}
			navigator.clipboard.writeText(cards.map(el => el.text).join('\n%slide%\n'))
				.catch(err => {
					alert('Error copying item<br>' + err);
				});
		}
	});

	$(document).on('keydown', function (e) {
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
		setFrame();
	});
});

function updateCards() {
	if ($('#list').children().length === 0) {
		let template = $('#cardTemplate').html();
		$('#list').append(template);
	}
	$('#list > .card').each(function () {
		$(this).find('.card-id').text($(this).index() + 1);
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
		// updateFrames();
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
	$('.card').each(function (el) {
		cards.push({
			text: $(this).find('.text').val(),
			pos: $(this).find('.button-position > img').attr('src').match(/pos-[0-9]+/)[0]
		});
	});
	// updateFrames();
}

function fromCards() {
	$('#list').empty();
	for (let card of cards) {
		let template = $('#cardTemplate').html();
		$('#list').append(template);
		$('.card:last-child').find('.text').val(card.text);
	}
	updateCards();
	// updateFrames();
}

function switchView() {
	if (viewMode) {
		$('#viewer').show();
		$('#editor').hide();
		updateFrames();
	} else {
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
	}
	if (override || theme) {
		$('#viewer').stop(true, true);
		$('#viewer').css('margin-left', -vw * slide);
	} else {
		$('#viewer').stop(true, true);
		$('#viewer').animate({
			marginLeft: -vw * slide
		}, 300);
	}
	$('.show').removeClass('show');
	$('.viewer > .frame').eq(slide).addClass('show');
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

function testPermission() {
	navigator.clipboard.readText()
		.then(text => {
			clipboardPerms = true;
			console.log('HasPerms');
		})
		.catch(() => {
			console.log('NoPerms');
			alert('Please allow clipboard permissions');
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