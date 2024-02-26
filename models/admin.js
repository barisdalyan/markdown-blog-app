import {createHmac, randomBytes} from 'crypto';
import {model, Schema} from 'mongoose';
import {createTokenForUser} from '../services/authentication.js';

const adminSchema = new Schema({
	fullName: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	salt: {
		type: String
	},
	password: {
		type: String,
		required: true
	},
	profileImageURL: {
		type: String,
		default: '/images/admin.jpeg'
	},
	role: {
		type: String,
		enum: ['USER', 'ADMIN'],
		default: 'ADMIN'
	}
}, {timestamps: true});

adminSchema.pre('save', function (next) {
	const admin = this;
	if (!admin.isModified('password')) return;
	const salt = randomBytes(16).toString();
	const hashedPassword = createHmac('sha256', salt).update(admin.password).digest('hex');
	this.salt = salt;
	this.password = hashedPassword;
	next();
});

adminSchema.static('matchPasswordAndGenerateToken', async function (email, password) {
	const admin = await this.findOne({email});
	if (!admin) throw new Error('Admin not found!');
	const salt = admin.salt;
	const hashedPassword = admin.password;
	const userProvidedHash = createHmac('sha256', salt).update(password).digest('hex');
	if (hashedPassword !== userProvidedHash) throw new Error('Incorrect admin password!');
	return createTokenForUser(admin);
});

const Admin = model('admins', adminSchema);
export {Admin};