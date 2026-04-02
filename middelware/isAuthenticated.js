const User = require("../model/shopModel")
const jwt = require('jsonwebtoken')

const isAuthenticated = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "authorization token is missing or invalid"
            })
        }
        const token = authHeader.split(" ")[1]
        let decoded
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY)
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "the registation token has expired"
                })
            }
            return res.status(400).json({
                success: false,
                message: "Access token is missing or invalid"
            })
        }

        const user = await User.findById(decoded.id)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Userr not found"
            })
        }
        req.id = user._id
        req.user = user
        next()

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



const isAdmin = async (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next()
    } else {
        return res.status(403).json({
            message: "Access denied: admin only"
        })
    }
}


module.exports = { isAuthenticated, isAdmin }
