const jwt = require("jsonwebtoken");

const generateToken = (admin) => {
    return jwt.sign({ login_id: admin.login_id }, process.env.JWT_KEY);
};

module.exports = generateToken;  // ✅ Export correctly
