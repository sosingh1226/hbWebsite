const router = require("express").Router();
const auth = require("../middleware/auth");

const { login, register, getUser } = require("../controllers/userController");

router.post("/register", register);

router.post("/login", login);

router.get("/", auth, getUser);

module.exports = router;
