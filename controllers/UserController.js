const User = require("../models/userModel");
const Confirm = require("../models/confirmModel");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const helper = require("../helpers/helper");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

module.exports = {
	register: async (req, res) => {
		try {
			const { email, password, passwordCheck, displayName, role } = req.body;

			// validation (need one conditional for email validation)
			if (!email || !password || !passwordCheck || !displayName || !role)
				return res
					.status(400)
					.json({ msg: "Not all fields have been entered!" });

			if (password.length < 8)
				return res
					.status(400)
					.json({ msg: "Password needs to be at least 8 characters long!" });

			if (password !== passwordCheck)
				return res.status(400).json({ msg: "Password not match!" });

			const user = await User.findOne({ email: email });

			if (user)
				return res
					.status(400)
					.json({ msg: "An account with this email already exists!" });

			const salt = await bcrypt.genSalt();
			const hashPw = await bcrypt.hash(password, salt);

			const createNewUser = new User({
				email,
				password: hashPw,
				displayName,
				role,
			});

			//begin confirmation here
			const confirmToken = new Confirm({
				token: crypto.randomBytes(10).toString("hex"),
				userId: createNewUser._id,
			});
			console.log(confirmToken);

			const transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.EMAIL,
					pass: process.env.PASS,
				},
			});

			const mailOption = {
				from: process.env.EMAIL,
				to: createNewUser.email,
				subject: "Thank you for signing up with Huddle Room!",
				text: `Click to confirm http://localhost:3000/confirm_token/${confirmToken.token}`
			}

			transporter.sendMail(mailOption, (error, info) => {
				if (error) {
					console.log(error)
				} else {
					console.log(`Email was sent with: http://localhost:3000/confirm_token/${confirmToken.token}`)
				}
			})

			await confirmToken.save();
			const saveUser = await createNewUser.save();

			res.json(saveUser);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},

	login: async (req, res) => {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				res.status(400).json({ message: "must input correct credentials" });
			}

			const user = await User.findOne({ email: email });
			console.log("Role:-", helper.RoleChecker(user)); //When a user logs in to the app, the role gets logged in to the console

			if (!user) {
				res.status(400).json({ message: "User not defined" });
			}

			const matchPw = await bcrypt.compare(password, user.password);

			if (!matchPw) {
				res.status(400).json({ message: "Incorrect password" });
			}
			const token = jwt.sign(
				{
					id: user._id,
					role: user.role,
				},
				process.env.JWT_SECRET,
				{ expiresIn: "2h" }
			);

			res.json({
				token,
				user: {
					id: user._id,
					displayName: user.displayName,
					role: user.role,
					confirmed: user.confirmed,
				},
			});
		} catch (err) {
			res.status(500).json({ msg: err });
		}
	},
	getUser: async (req, res) => {
		try {
			const user = await User.findById(req.user);

			res.json({
				displayName: user.displayName,
				id: user._id,
				role: user.role,
			});
		} catch (err) {
			res.send(err.response);
		}
	},
};
