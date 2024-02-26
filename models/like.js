import {model, Schema} from 'mongoose';

const likeSchema = new Schema({
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

const Like = model('likes', likeSchema);
export {Like};