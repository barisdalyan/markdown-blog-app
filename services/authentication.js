import JWT from 'jsonwebtoken';

// Generate unique secret keys for users and store them in a separate database
const secret = '$uperMan@123';

function createTokenForUser(user) {
	const payload = {
		_id: user._id,
		email: user.email,
		profileImageURL: user.profileImageURL,
		role: user.role
	};
	return JWT.sign(payload, secret, {expiresIn: '1d'});
}

function validateToken(token) {
	const payload = JWT.verify(token, secret);
	return payload;
}

export {createTokenForUser, validateToken};