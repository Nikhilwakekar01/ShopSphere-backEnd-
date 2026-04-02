const { Schema, model, default: mongoose } = require("mongoose");
const Product = require("./ProductModel");

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: Product,
                require: true
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ]


}, { timestamps: true });

const Cart = model("Cart", cartSchema);
module.exports = Cart