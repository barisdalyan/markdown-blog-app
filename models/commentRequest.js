import {model, Schema} from 'mongoose';

const commentRequestSchema = new Schema({
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

const CommentRequest= model('commentRequests', commentRequestSchema);
export {CommentRequest};