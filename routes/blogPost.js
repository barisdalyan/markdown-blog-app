import {Router} from 'express';
import {BlogPost} from '../models/blogPost.js';
import {Comment} from '../models/comment.js';
import {Like} from '../models/like.js';
import {CommentRequest} from '../models/commentRequest.js';

const router = Router();

router.get('/:postSlug', async (req, res) => {
	const postSlugList = req.params.postSlug.split('-');
	const postId = postSlugList[postSlugList.length - 1];
	const blogPost = await BlogPost.findById(postId).populate('createdBy');
	const comments = await Comment.find({postId: postId}).populate('createdBy');
	let likes = await Like.find({postId}).populate('createdBy');
	try {
		const condition = likes.every((item) => {
			return req.user._id !== item.createdBy._id.toString();
		});
		if (likes.length) {
			if (condition) {
				likes = {isUserLiked: false, amount: likes.length};
			} else {
				likes = {isUserLiked: true, amount: likes.length};
			}
		} else {
			likes = {isUserLiked: false, amount: 0};
		}
	} catch (error) {
		likes = {isUserLiked: false, amount: likes.length};
		console.error(error);
	}
	return res.render('blogPost', {
		user: req.user,
		blogPost,
		likes,
		comments
	});
});

router.post('/comment/:postSlug', async (req, res) => {
	const postSlugList = req.params.postSlug.split('-');
	const postId = postSlugList[postSlugList.length - 1];
	await CommentRequest.create({
		content: req.body.content,
		postId,
		postSlug: req.params.postSlug,
		createdBy: req.user._id
	});
	return res.redirect(`/posts/${req.params.postSlug}`);
});

router.post('/like/:postSlug', async (req, res) => {
	const postSlugList = req.params.postSlug.split('-');
	const postId = postSlugList[postSlugList.length - 1];
	const likes = await Like.find({postId});
	const condition = likes.every((item) => {
		return req.user._id !== item.createdBy._id.toString();
	});
	if (condition) {
		await Like.create({
			postId,
			postSlug: req.params.postSlug,
			createdBy: req.user._id
		});
	}
	return res.redirect(`/posts/${req.params.postSlug}`);
});

router.post('/dislike/:postSlug', async (req, res) => {
	const postSlugList = req.params.postSlug.split('-');
	const postId = postSlugList[postSlugList.length - 1];
	await Like.findOneAndDelete({postId, createdBy: req.user._id});
	return res.redirect(`/posts/${req.params.postSlug}`);
});

export {router};