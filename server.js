require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const PORT = process.env.PORT || 4000
const app = express()

// Middleware
app.use(cors())
app.use(morgan('dev'))

// Sequelize Models
const db = require('./models')
const Category = db.Category
const Product = db.Product

// Router files


// Routes
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Route working'
  })
  // const error = new Error('it blew up')
  // next(error)
})

app.get('/api/categories', (req, res, next) => {
  Category.findAll({
    include: [{ model: Product }]
  })
    .then(categories => {
      res.json({
        categories
      })
    })
    .catch(error => {
      next(error)
    })
})

app.get('/api/products', (req, res, next) => {
  Product.findAll({
    include: [{ model: Category }]
  })
    .then(products => {
      res.json({
        products
      })
    })
    .catch(error => {
      next(error)
    })
})

app.get('/api/products/:id', (req, res, next) => {
  const id = req.params.id

  Product.findByPk(id, {
    include: [{ model: Category }]
  })
    .then(product => {
      res.json({
        product
      })
    })
    .catch(error => {
      console.log(error)
    })
})

app.post('/api/checkout', async (req, res, next) => {
  const lineItems = [{
    name: 'T-shirt',
    description: 'Comfortable cotton t-shirt',
    images: ['http://lorempixel.com/400/200/'],
    amount: 500,
    currency: 'usd',
    quantity: 1,
  }]

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    })
    res.json({ session })
  }
  catch (error) {
    res.status(400).json({ error })
  }
})
 
// Error handling
// The following 2 `app.use`'s MUST follow ALL your routes/middleware
app.use(notFound)
app.use(errorHandler)

// eslint-disable-next-line
function notFound(req, res, next) {
  res.status(404).send({ error: 'Not found!', status: 404, url: req.originalUrl })
}

// eslint-disable-next-line
function errorHandler(err, req, res, next) {
  console.error('ERROR', err)
  const stack = process.env.NODE_ENV !== 'production' ? err.stack : undefined
  res.status(500).send({ error: err.message, stack, url: req.originalUrl })
}

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`)
})





// const createCheckoutSession = async (req, res) => {
//   const lineItems = createLineItems(req.body)

//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: lineItems,
//       success_url: 'http://localhost:3000/purchase/success',
//       cancel_url: 'http://localhost:3000/purchase/cancel',
//     })
//     res.json({ session })
//   }
//   catch (error) {
//     res.status(400).json({ error })
//   }
// }

// const fulfillCheckoutPurchase = (req, res) => {
//   console.log('fulfilling')
//   const sig = req.headers['stripe-signature']
//   let event

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
//   } catch (err) {
//     return res.status(400).send(`Webhook Error: ${err.message}`)
//   }

//   // Handle the checkout.session.completed event
//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object

//     // Fulfill the purchase...
//     console.log('checkout session data', session)
//   }

//   // Return a response to acknowledge receipt of the event (to stripe)
//   res.json({ received: true })
// }

// ---------------------------------------- HELPER FUNCTIONS ----------------------------------------

// function createLineItems(reports) {
//   return reports.map(({ market, state, price }) => {
//     return {
//       name: `${market}, ${state}`,
//       description: `PDF report for ${market}, ${state}.`,
//       amount: price * 100,
//       currency: 'usd',
//       quantity: 1
//     }
//   })
// }