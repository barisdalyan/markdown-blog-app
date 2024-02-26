import {model, Schema} from 'mongoose';

const commentSchema = new Schema({
	content:{
		type: String,
		required: true
	},
	postId:{
		type: Schema.Types.ObjectId,
		ref: 'posts'
	},
	postSlug: {
		type: String,
		required: true
	},
	createdBy:{
		type: Schema.Types.ObjectId,
		ref: 'users'
	}
}, {timestamps: true});

const Comment= model('comments', commentSchema);
export {Comment};