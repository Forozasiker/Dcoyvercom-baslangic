const jwt = require('jsonwebtoken');

const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d"
    })
}

module.exports = {
    createToken
}
