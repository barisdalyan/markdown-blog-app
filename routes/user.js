import {Router} from 'express';
import {User} from '../models/user.js';
import requestIP from 'request-ip';
import {BannedIP} from '../models/bannedIP.js';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

const router = Router();

function uploadCoverImage() {
	const storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, path.resolve('./public/uploads/'));
		},
		filename: function (req, file, cb) {
			const fileName = `${Date.now()}-${file.originalname}`;
			cb(null, fileName);
		}
	});
	return multer({storage: storage});
}

router.get('/signin', async (req, res) => {
	return res.render('signin');
});

router.get('/signup', (req, res) => {
	return res.render('signup');
});

router.get('/logout', (req, res) => {
	return res.clearCookie('userToken').redirect('/');
});

router.get('/profile', async (req, res) => {
	const user = await User.findOne({email: req.user.email});
	return res.render('profile', {
		user
	});
});

router.post('/signin', async (req, res) => {
	const {email, password} = req.body;
	const clientIP = requestIP.getClientIp(req);
	const bannedIP = await BannedIP.findOne({ip: clientIP});
	if (bannedIP) {
		bannedIP.currentUnixTime = Date.now();
		bannedIP.attemptAmount += 1;
		const initialInterval = bannedIP.currentUnixTime - bannedIP.initialUnixTime;
		if (initialInterval < 60 * 1000 && bannedIP.rateLimitHitUnixTime === 0) {
			if (bannedIP.attemptAmount >= 3) {
				bannedIP.rateLimitHitUnixTime = Date.now();
				await bannedIP.save();
				return res.status(429).json({
					error: '429 Too Many Requests',
					message: 'Rate limit exceeded, please try five minutes later!',
				});
			} else {
				await bannedIP.save();
				try {
					const token = await User.matchPasswordAndGenerateToken(email, password);
					await BannedIP.findOneAndDelete({ip: clientIP});
					return res.cookie('userToken', token).redirect('/');
				} catch (error) {
					return res.render('signin', {
						error: 'Incorrect email or password!'
					});
				}
			}
		} else {
			if (bannedIP.rateLimitHitUnixTime !== 0) {
				bannedIP.currentUnixTime = Date.now();
				if ((bannedIP.currentUnixTime - bannedIP.rateLimitHitUnixTime) < bannedIP.banPeriod) {
					bannedIP.attemptAmount += 1;
					await bannedIP.save();
					return res.status(429).json({
						error: '429 Too Many Requests',
						message: 'Rate limit exceeded, please try five minutes later!',
					});
				} else {
					bannedIP.initialUnixTime = Date.now();
					bannedIP.rateLimitHitUnixTime = 0;
					bannedIP.attemptAmount = 1;
					await bannedIP.save();
					try {
						const token = await User.matchPasswordAndGenerateToken(email, password);
						await BannedIP.findOneAndDelete({ip: clientIP});
						return res.cookie('userToken', token).redirect('/');
					} catch (error) {
						return res.render('signin', {
							error: 'Incorrect email or password!'
						});
					}
				}
			} else {
				bannedIP.initialUnixTime = Date.now();
				bannedIP.attemptAmount = 1;
				await bannedIP.save();
				try {
					const token = await User.matchPasswordAndGenerateToken(email, password);
					await BannedIP.findOneAndDelete({ip: clientIP});
					return res.cookie('userToken', token).redirect('/');
				} catch (error) {
					return res.render('signin', {
						error: 'Incorrect email or password!'
					});
				}
			}
		}
	} else {
		await BannedIP.create({
			ip: clientIP,
			banPeriod: 5 * 60 * 1000,
			initialUnixTime: Date.now(),
			rateLimitHitUnixTime: 0,
			currentUnixTime: Date.now(),
			attemptAmount: 1
		});
		try {
			const token = await User.matchPasswordAndGenerateToken(email, password);
			await BannedIP.findOneAndDelete({ip: clientIP});
			return res.cookie('userToken', token).redirect('/');
		} catch (error) {
			return res.render('signin', {
				error: 'Incorrect email or password!'
			});
		}
	}
});

router.post('/signup', async (req, res) => {
	const {fullName, email, password} = req.body;
	await User.create({
		fullName,
		email,
		password
	});
	return res.redirect('/');
});

router.put('/profile/edit/:userId', uploadCoverImage().single('profileImage'), async (req, res) => {
	const user = await User.findById(req.params.userId);
	let profileImageURL;
	if (req.file) {
		if (user.profileImageURL !== '/images/default.png') {
			fs.unlinkSync(`./public${user.profileImageURL}`);
		}
		profileImageURL = `/uploads/${req.file.filename}`;
	} else {
		profileImageURL = user.profileImageURL;
	}
	await User.findByIdAndUpdate(req.params.userId, {
		fullName: req.body.fullName.trim(),
		profileImageURL
	});
	return res.redirect('/');
});

export {router};