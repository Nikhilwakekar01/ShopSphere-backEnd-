const { Schema, model } = require("mongoose");

const ProductSchema = new Schema({
    ProductName: {
        type: String,
        require: true
    },
    Description: {
        type: String,
        require: true
    },
    price: {
        type: Number,
        require: true
    },
    image: {
        type: String,
        default: ""
    }
})

const Product = model("Product", ProductSchema)
module.exports = Product