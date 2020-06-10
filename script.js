// TODO: Replace with .bind
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

var slideBack = ['ArrowDown', 'ArrowLeft', 'Backspace'];
var slideForward = ['ArrowUp', 'ArrowRight', ' ', 'Enter'];

var vw = $(window).width();
var clipboardPerms = false;

$(document).ready(function () {
	updateCards();

	$(document).on('keydown', function (e) {
		if (e.key === 'Escape') {
			viewMode = !viewMode;
			view();
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
					cards = text.split('\n').map(el => {
						return {
							text: el
						};
					});
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
			navigator.clipboard.writeText(cards.map(el => el.text).join('\n'))
				.then(() => {
					// alert('Item Copied!');
				})
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
			}
			setView(step);
		}
	});

	$(document).on('click', function () {
		if (viewMode) {
			slide = slide + 1 >= cards.length ? cards.length - 1 : slide + 1;
			setView();
		}
	});

	$(document).on('contextmenu', function (e) {
		if (viewMode) {
			e.preventDefault();
			slide = slide - 1 < 0 ? 0 : slide - 1;
			setView();
		}
	});

	$(window).on('resize', function () {
		vw = $(window).width();
		setView();
	});
});

function updateCards() {
	if ($('#list').children().length === 0) {
		let template = $('#cardTemplate').html();
		$('#list').append(template);
		$('#viewer').html('<p class="frame" style="background-color:white;color:black">No slides</p>');
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
		setView(true);
		viewMode = true;
		view();
	});

	$('.button-position').off('click');
	$('.button-position').on('click', function () {
		let img = $(this).find('img');
		let pos = img.attr('src');
		img.attr('src', `icons/pos-${(pos.match(/[0-9]+/)[0]+1) % 9}.png`);
		updateCards();
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
		updateFrames();
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
}

function calcCards() {
	cards = [];
	$('.card').each(function (el) {
		cards.push({
			text: $(this).find('.text').val(),
			pos: $(this).find('.button-position > img').attr('src').match(/[0-9]+/)[0]
		});
	});
	updateFrames();
}

function fromCards() {
	$('#list').empty();
	for (let card of cards) {
		let template = $('#cardTemplate').html();
		$('#list').append(template);
		$('.card:last-child').find('.text').val(card.text);
	}
	updateCards();
	updateFrames();
}

function view() {
	if (viewMode) {
		$('#viewer').show();
		$('#editor').hide();
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

function setView(override = false) {
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
		$('#viewer').append(`<div class="frame ${colors[i % colors.length]}">${render(cards[i].text)}</div>`)
		$('#viewer > .frame').eq(i).addClass(
			$('#list > .card').eq(i).find('.button-position > img')
			.attr('src').match(/pos-[0-9]+/)[0]);

		$('#list > .card').eq(i).find('.card-id')
		.attr('class', 'card-id ' + colors[i % colors.length]);
	}
	$('.image-only').removeClass('.image-only');
	$('#viewer > .frame > p:only-child > img:only-child').parent().addClass('image-only');
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