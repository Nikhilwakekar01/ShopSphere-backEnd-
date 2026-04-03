const express = require('express')
const app = express()
const dotenv = require('dotenv');
const connectDB = require('./config/shopDb')
dotenv.config();
connectDB();
const PORT = process.env.PORT
const ProductRouter = require('./route/shopRoute');
const { register } = require('./controller/ShopController');
const shopRoute = require('./route/shopRoute')
const cors = require('cors');



app.use(cors({
  origin: 'https://shop-sphere-front-end-eslw.vercel.app',
  credentials: true
}))

app.use(express.json());
app.get('/', (req, res) => {

  res.send('hello word ')
})
app.use('/api', shopRoute);




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
}) 