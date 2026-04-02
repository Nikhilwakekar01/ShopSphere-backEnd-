const { model, Schema } = require("mongoose");

const UserModel = new Schema({
    firstName:{
        type:String,
        require:true
    },
    lastName:{
        type:String,
        require:true
    },
    profilePic:{
        type:String,//cloud img url
        default:""
    },
    profilePicPublicId:{
        type:String,//cloud public_id for deletion
        default:""
    },
    email:{
        type:String,
        require:true,
        unique:true
    
    },
    password:{
        type:String,
        require:true
    },
    confirmPassword:{
        type:String,
        require:true
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    isLoggedIn:{
        type:Boolean, 
        default:false
    },
    token:{
        type:String,
        default:null
    },
    otp:{
        type:String,
        default:null
    },
    otpExpire:{
        type:Date,
        default:null
    },
    address:{
        type:String,

    },
    country:{
        type:String
    },
    city:{
        type:String
    },
    state:{
        type:String
    },
    zipCode:{
        type:String
    },
    phoneNo:{
        type:String
    }
},{timestamps:true})

const User = model('User',UserModel);
module.exports =User