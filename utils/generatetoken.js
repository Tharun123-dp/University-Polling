const jwt = require("jsonwebtoken");

const generateToken = (admin) => {
    return jwt.sign({ admin_email: admin.admin_email }, process.env.JWT_KEY);
};

module.exports = generateToken;
