import {Router} from 'express';
import {Admin} from '../models/admin.js';
import {BlogPost} from '../models/blogPost.js';
import {Comment} from '../models/comment.js';
import {CommentRequest} from '../models/commentRequest.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import requestIP from 'request-ip';
import {BannedIP} from '../models/bannedIP.js';

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

router.get('/signin', (req, res) => {
	return res.render('adminSignin');
});

router.get('/signup', (req, res) => {
	return res.render('adminSignup');
});

router.get('/logout', (req, res) => {
	return res.clearCookie('adminToken').redirect('/');
});

router.get('/posts/add', (req, res) => {
	return res.render('addPost', {
		user: req.user
	});
});

router.get('/posts/edit/:postSlug', async (req, res) => {
	const postSlugList = req.params.postSlug.split('-');
	const postId = postSlugList[postSlugList.length - 1];
	const blogPost = await BlogPost.findById(postId).populate('createdBy');
	return res.render('editPost', {
		user: req.user,
		blogPost
	});
});

router.get('/comments', async (req, res) => {
	let comments;
	try {
		comments = await CommentRequest.find({}).populate('createdBy').populate('postId');
	} catch (error) {
		console.error(JSON.stringify(error));
	}
	return res.render('commentRequest', {
		user: req.user,
		comments
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
					const adminToken = await Admin.matchPasswordAndGenerateToken(email, password);
					await BannedIP.findOneAndDelete({ip: clientIP});
					return res.cookie('adminToken', adminToken).redirect('/');
				} catch (error) {
					return res.render('adminSignin', {
						error: 'Incorrect admin email or password!'
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
						const adminToken = await Admin.matchPasswordAndGenerateToken(email, password);
						await BannedIP.findOneAndDelete({ip: clientIP});
						return res.cookie('adminToken', adminToken).redirect('/');
					} catch (error) {
						return res.render('adminSignin', {
							error: 'Incorrect admin email or password!'
						});
					}
				}
			} else {
				bannedIP.initialUnixTime = Date.now();
				bannedIP.attemptAmount = 1;
				await bannedIP.save();
				try {
					const adminToken = await Admin.matchPasswordAndGenerateToken(email, password);
					await BannedIP.findOneAndDelete({ip: clientIP});
					return res.cookie('adminToken', adminToken).redirect('/');
				} catch (error) {
					return res.render('adminSignin', {
						error: 'Incorrect admin email or password!'
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
			const adminToken = await Admin.matchPasswordAndGenerateToken(email, password);
			await BannedIP.findOneAndDelete({ip: clientIP});
			return res.cookie('adminToken', adminToken).redirect('/');
		} catch (error) {
			return res.render('adminSignin', {
				error: 'Incorrect admin email or password!'
			});
		}
	}
});

router.post('/signup', async (req, res) => {
	const {fullName, email, password} = req.body;
	await Admin.create({
		fullName,
		email,
		password
	});
	return res.redirect('/');
});

router.post('/posts/add', uploadCoverImage().single('coverImage'), async (req, res) => {
	const {title, description, content} = req.body;
	const registeredBlogPost = await BlogPost.findOne({title: title});
	if (registeredBlogPost === null) {
		const blogPost = await BlogPost.create({
			title: title.trim(),
			description: description.trim(),
			content: content.trim(),
			createdBy: req.user._id,
			coverImageURL: `/uploads/${req.file.filename}`
		});
		return res.redirect(`/posts/${blogPost.slug}-${blogPost._id}`);
	} else {
		console.log('The post already registered!');
		return res.redirect('/');
	}
});

router.delete('/posts/:postId', async (req, res) => {
	const blogPost = await BlogPost.findById(req.params.postId);
	const coverImageURL = blogPost.coverImageURL;
	await BlogPost.findByIdAndDelete(req.params.postId);
	fs.unlinkSync(`./public${coverImageURL}`);
	res.redirect('/');
});

router.post('/comment/accept/:commentId', async (req, res) => {
	try {
		const comment = await CommentRequest.findById(req.params.commentId);
		await Comment.create({
			content: comment.content,
			postId: comment.postId,
			postSlug: comment.postSlug,
			createdBy: comment.createdBy
		});
		await CommentRequest.findByIdAndDelete(req.params.commentId);
	} catch (error) {
		console.error(error);
	}
	return res.redirect('/admin/comments/');
});

router.delete('/comment/remove/:commentId', async (req, res) => {
	try {
		await CommentRequest.findByIdAndDelete(req.params.commentId);
	} catch (error) {
		console.error(error);
	}
	return res.redirect('/admin/comments/');
});

router.put('/posts/edit/:postSlug', uploadCoverImage().single('coverImage'), async (req, res) => {
	const {title, description, content} = req.body;
	const postSlugList = req.params.postSlug.split('-');
	const postId = postSlugList[postSlugList.length - 1];
	let blogPost = await BlogPost.findById(postId);
	blogPost.title = title.trim();
	blogPost.description = description.trim();
	blogPost.content = content.trim();
	blogPost.createdBy = req.user._id;
	if (req.file) {
		fs.unlinkSync(`./public${blogPost.coverImageURL}`);
		blogPost.coverImageURL = `/uploads/${req.file.filename}`;
	}
	blogPost = await blogPost.save();
	return res.redirect(`/posts/${blogPost.slug}-${blogPost._id}`);
});

export {router};