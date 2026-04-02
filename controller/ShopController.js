const User = require('../model/shopModel');
const bcrypt = require('bcrypt')
const verifyMail = require('../emailVerify/verifyEmail')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv');
const Session = require('../model/sessionModel');
const sendOTPMail = require('../emailVerify/sendOTPMail');
dotenv.config();

//business logic

const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password do not match"
            })
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already Exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            

        })
 
        const token = jwt.sign(
            { id: newUser._id },
            process.env.SECRET_KEY,
            { expiresIn: "10m" }
        )
        verifyMail(token, email)
        newUser.token = token
        await newUser.save()


        return res.status(201).json({
            success: true,
            message: "User Registered successfully",
            data: newUser

        })


    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })

    }
}

const verify = async (req, res) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(400).json({
                success: false,
                message: "Authorization token is missing or invalid"
            })
        }

        const token = authHeader.split(" ")[1] //[Bearer, fsjkdoernonl]
        let decoded
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY)
        } catch (error) {
            if (error.name === "tokenExpiredError") {
                return res.status(400).json({
                    success: false,
                    message: "The registration token has expired"
                })
            }
            return res.status(400).json({
                success: false,
                message: "Token verification failed"
            })
        }
        const user = await User.findById(decoded.id)
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        user.token = null
        user.isVerified = true
        await user.save()
        return res.status(200).json({
            success: true,
            message: "Email verified Successfully"
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const reVerify = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "user not found"
            })
        }
        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "10m" });
        verifyMail(token, email)//send emailhere
        user.token = token
        await user.save()
        return res.status(200).json({
            success: true,
            message: "Verification email sent again successfully",
            token: user.token
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const logIn = async (req, res) => {
    try {


        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All field are required"
            })
        }

        const existingUser = await User.findOne({ email })


        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User not exist"
            })
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.password)
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "invalid Credentials"
            })
        }

        if (existingUser.isVerified === false) {
            return res.status(400).json({
                success: false,
                message: "verify your account then login"
            })
        }

        //generate token
        const accessToken = jwt.sign({ id: existingUser._id }, process.env.SECRET_KEY, { expiresIn: "10d" })
        const refreshToken = jwt.sign({ id: existingUser._id }, process.env.SECRET_KEY, { expiresIn: "30d" })

        existingUser.isLoggedIn = true
        await existingUser.save()

        //check for existing session snd delete it
        const existingSession = await Session.findOne({ userId: existingUser._id })
        if (existingSession) {
            await Session.deleteOne({ userId: existingUser._id })
        }


        //Create a new Session
        await Session.create({ userId: existingUser._id })
        return res.status(200).json({
            success: true,
            message: `Welcome back ${existingUser.firstName}`,
            user:existingUser,
            accessToken,
            refreshToken 
        })


    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message
        })

    }
}

const logOut = async (req, res) => {
    try {
        const userId = req.id
        await Session.deleteMany({ userId: userId })
        await User.findByIdAndUpdate(userId, { isLoggedIn: false })
        return res.status(200).json({
            success: true,
            message: "User Logged out successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) //10 min
        user.otp = otp
        user.otpExpire = otpExpiry

        await user.save()
        await sendOTPMail(otp, email)
        return res.status(200).json({
            success: true,
            message: "otp sent to email successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body
        const email = req.params.email
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'Otp is required'
            })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }
        if (!user.otp || !user.otpExpire) {
            return res.status(400).json({
                success: false,
                message: "otp is not generated or already verified"
            })
        }

        if (user.otpExpire < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Otp has expired Please request a new one"
            })
        }

        if (otp !== user.otp) {
            return res.status(400).json({
                success: false,
                message: "otp is invalid"
            })
        }

        user.otp = null
        user.otpExpire = null
        await user.save()
        return res.status(200).json({
            success: true,
            message: 'otp verified successfully'
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })

    }

}

const changePassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const { email } = req.params
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All Fields are required"
            })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password do not match"
            })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        await user.save()
        return res.status(200).json({
            success: true,
            message: "Password change Successfully"
        })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })

    }
}

const allUsers = async (_, res) => {
    try {
        const users = await User.find()
        return res.status(200).json({
            success: true,
            users
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select("-password -otp -otpExpire -token ")
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        res.status(200).json({
            success: true,
            user,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const updateProfile= async (req,res) =>{
    try {
        const loginUser = req.user
        const userIdToUpdate = req.params._id
        const {firstName,lastName,email,address,country,city,state,zipCode,phoneNo,role} =  req.body;

        if(loginUser._id.toString() !== userIdToUpdate && loginUser.role !== 'admin'){
            return res.status(403).json({
                success: false,
                message:"You are not allowed to Update"
            })
        }

        let user = await User.findById(userIdToUpdate);
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        //updated fields

        user.firstName = firstName || user.firstName
        user.lastName = lastName || user.lastName
        user.address = address || user.address
        user.city = city || user.city
        user.state = state || user.state
        user.country = country|| user.country
        user.email = email|| user.email
        user.zipCode = zipCode || user.zipCode
        user.phoneNo = phoneNo || user.phoneNo
        user.role = role || user.role

        const updatedUser= await user.save();

        return res.status(200).json({
            success:true,
            message:"User updated Successfully",
            user:updatedUser
        })
        
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}


module.exports = { register, verify, reVerify, logIn, logOut, forgotPassword, verifyOTP, changePassword, allUsers, getUserById,updateProfile } 