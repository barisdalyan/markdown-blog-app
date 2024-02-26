import {validateToken} from '../services/authentication.js';

function checkForAuthenticationCookie(cookieName) {
	return (req, res, next) => {
		const tokenCookieValue = req.cookies[cookieName];
		if (!tokenCookieValue) {
			next();
			return;
		}

		try {
			const userPayload = validateToken(tokenCookieValue);
			req.user = userPayload;
		} catch (error) {
			console.error(error);
		}
		next();
	};
}

export {checkForAuthenticationCookie};