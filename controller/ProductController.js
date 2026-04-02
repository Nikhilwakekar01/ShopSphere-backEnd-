const Cart = require("../model/cartModel");
const Product = require("../model/ProductModel");
const cloudinary = require("../utils/cloudinary")

const getProduct = async (req, res) => {
    try {
        const products = await Product.find();

        return res.status(200).json({
            success: true,
            products
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
const createProduct = async (req, res) => {
    try {
        const { name, price, description } = req.body;
        const file = req.file;
        const result = await cloudinary.uploader.upload(file.path)
        const product = await Product.create({
            name,
            price,
            description,
            image: result.secure_url
        });

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const addToCart = async (req, res) => {
    try {
        const userId = req.id;
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }
        const index = cart.items.findIndex(
            item =>
                item.productId &&
                item.productId.toString() === productId
        );
        if (index > -1) {
            cart.items[index].quantity += 1;
        } else {
            cart.items.push({ productId, quantity: 1 });
        }
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Product added to cart",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });

    }


}

const getCart = async (req, res) => {
    try {
        const userId = req.id;
        const cart = await Cart.findOne({ userId })
            .populate("items.productId")
        return res.status(200).json({
            success: true,
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
}
const removeFromCart = async (req, res) => {
    try {
        const userId = req.id;
        const { productId } = req.body;
        let cart = await Cart.findOne({ userId })
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }
        cart.items = cart.items.filter(
            item => item.productId.toString() !== productId
        );
        await cart.save();
        res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
}

module.exports = { addToCart, removeFromCart, getProduct, createProduct, getCart } 