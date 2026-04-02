const express = require('express');
const { register, verify, reVerify, logIn, logOut, forgotPassword, verifyOTP, changePassword, allUsers, getUserById, updateProfile } = require('../controller/ShopController');
const { isAuthenticated, isAdmin } = require('../middelware/isAuthenticated');
const { addToCart, removeFromCart, getProduct, createProduct, getCart } = require('../controller/ProductController');
const upload = require('../middelware/mutlerFile');
const router = express.Router();

router.post('/register', register);
router.post('/verify', verify);
router.post('/reverify', reVerify);
router.post('/login', logIn);
router.post('/logOut', isAuthenticated, logOut);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp/:email', verifyOTP);
router.post('/change-password/:email', changePassword);
router.get('/all-user', isAuthenticated, isAdmin, allUsers);
router.get('/getUserById/:userId', getUserById);
router.put('/update/:id', isAuthenticated, updateProfile);
router.get('/getProduct', getProduct)
router.post('/addToCart', isAuthenticated, addToCart)
router.post('/removeFromCart', isAuthenticated, removeFromCart)
router.post('/createProduct', upload.single("image"), createProduct)
router.get('/getCart', isAuthenticated, getCart)










module.exports = router;