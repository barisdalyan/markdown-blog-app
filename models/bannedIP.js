import {model, Schema} from 'mongoose';

const bannedIPSchema = new Schema({
	ip: {
		type: String,
		required: true
	},
	banPeriod: {
		type: Number,
		required: true
	},
	initialUnixTime: {
		type: Number,
		required: true
	},
	rateLimitHitUnixTime: {
		type: Number
	},
	currentUnixTime: {
		type: Number,
		required: true
	},
	attemptAmount: {
		type: Number,
		required: true
	}
}, {timestamps: true});

const BannedIP = model('bannedIPs', bannedIPSchema);
export {BannedIP};