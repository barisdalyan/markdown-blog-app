import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import {router as adminRoute} from './routes/admin.js';
import {router as userRoute} from './routes/user.js';
import {router as blogPostRoute} from './routes/blogPost.js';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import {checkForAuthenticationCookie} from './middlewares/authentication.js';
import {BlogPost} from './models/blogPost.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const URI = process.env.MONGODB_URI;

mongoose.connect(URI).then(response => {
	console.log('Connected to database.');
});

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));
app.use(express.static(path.resolve('./public')));
app.use(express.static('./public/images'));
app.use(express.static('./public/css'));
app.use(express.static('./public/js'));
app.use('/admin/signin', express.static('./public/images'));
app.use('/admin/signup', express.static('./public/images'));
app.use('/admin/comments', express.static('./public/images'));
app.use('/admin/posts/add', express.static('./public/images'));
app.use('/admin/posts/edit', express.static('./public/images'));
app.use('/user/signin', express.static('./public/images'));
app.use('/user/signup', express.static('./public/images'));
app.use('/posts', express.static('./public/images'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(checkForAuthenticationCookie('userToken'));
app.use(checkForAuthenticationCookie('adminToken'));

app.get('/', async (req, res, next) => {
	const allBlogPosts = await BlogPost.find({});
	res.render('home', {
		user: req.user,
		blogPosts: allBlogPosts
	});
	next();
});

app.use('/admin', adminRoute);
app.use('/user', userRoute);
app.use('/posts', blogPostRoute);

app.listen(PORT, () => {
	console.log(`Server started at port:${PORT}`);
});