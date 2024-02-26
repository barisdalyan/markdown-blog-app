import {model, Schema} from 'mongoose';
import slugify from 'slugify';
import {marked} from 'marked';
import createDomPurify from 'dompurify';
import {JSDOM} from 'jsdom';

const dompurify = createDomPurify(new JSDOM().window);
const postSchema = new Schema({
	title: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	content: {
		type: String,
		required: true
	},
	coverImageURL: {
		type: String,
		required: false
	},
	createdBy: {
		type: Schema.Types.ObjectId,
		ref: 'admins'
	},
	slug: {
		type: String,
		required: true,
		unique: true
	},
	sanitizedDescriptionHtml: {
		type: String,
		required: true
	},
	sanitizedContentHtml: {
		type: String,
		required: true
	}
}, {timestamps: true});

postSchema.pre('validate', function (next) {
	if (this.title) this.slug = slugify(this.title, {lower: true, strict: true});
	if (this.description) this.sanitizedDescriptionHtml = dompurify.sanitize(marked(this.description));
	if (this.content) this.sanitizedContentHtml = dompurify.sanitize(marked(this.content));
	next();
});

const BlogPost = model('posts', postSchema);
export {BlogPost};