const content = document.getElementsByClassName('content')[0];
const text = document.getElementsByClassName('text')[0];
const num = document.getElementsByClassName('num')[0];
const heart = document.getElementsByClassName('heart')[0];

let isClicked = false;

function toggleHeartActive() {
	content.classList.toggle('heart-active');
	text.classList.toggle('heart-active');
	num.classList.toggle('heart-active');
	heart.classList.toggle('heart-active');
}

function updateLikeAmount(isClicked) {
	if (isClicked) {
		likeAmount += 1;
		isClicked = true;
	} else {
		likeAmount -= 1;
		isClicked = false;
	}
	num.innerHTML = likeAmount.toString();
}

async function sendPostAction(url) {
	try {
		await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			}
		});
	} catch (error) {
		console.error(error);
	}
}

async function handleLikeButtonClick() {
	isClicked = !isClicked;
	const action = isClicked ? 'like' : 'dislike';
	const url = `/posts/${action}/${postSlug}-${postId}`;
	try {
		if (isUserAuthorized === 'true') {
			toggleHeartActive();
			updateLikeAmount(isClicked);
			await sendPostAction(url);
		} else {
			window.location.href = '/user/signin';
		}
	} catch (error) {
		console.error(error);
	}
}

function initializeLikeButton() {
	if (isUserLiked === 'true' && isUserAuthorized === 'true') {
		toggleHeartActive();
		isClicked = true;
	}
}

initializeLikeButton();

content.addEventListener('click', handleLikeButtonClick);