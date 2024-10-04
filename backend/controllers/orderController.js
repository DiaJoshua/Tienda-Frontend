const orderModel = require('../models/orderModel');
const userModel = require('../models/userModels');
const axios = require('axios');

const generateReferenceNumber = () => {
  // Generate a unique reference using timestamp and random numbers
  return `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

//const stripe = require('stripe')(process.env.REACT_APP_CHECKOUT_SECRET_API_KEY);

const PlaceOrder = async (req, res) => {
  const frontend_url = 'tienda-frontend-sandy.vercel.app';

  try {
    // Debugging: Print the Stripe key to verify it's being read correctly
    console.log("Paymaya Secret Key:", process.env.REACT_APP_CHECKOUT_PUBLIC_API_KEY);

    // Create new order
    const newOrder = new orderModel({
      userId: req.user.id,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // Create line items for Stripe
    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "php",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100 * 58,
      },
      quantity: item.quantity
    }))

    // Add delivery charges
    line_items.push({
      price_data: {
        currency: "PHP",
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: 50 * 100 * 58,
      },
      quantity: 1
    })
    console.log(JSON.stringify(requestBody, null, 2));

    const createPayMayaCheckout = async (order, buyerInfo, requestReferenceNumber) => {
      try {
        // PayMaya Sandbox API endpoint
        const payMayaApiUrl = "https://pg-sandbox.paymaya.com/checkout/v1/checkouts";
    
        // Fetch your PayMaya API key from environment variables
        const secretKey = process.env.REACT_APP_CHECKOUT_PUBLIC_API_KEY;
        if (!secretKey) {
          throw new Error("PayMaya API Key missing from environment configuration");
        }
    
        // Prepare headers
        const encodedKey = Buffer.from(`${secretKey}:`).toString("base64");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Basic ${encodedKey}`,
        };
    
        // Create the payload for PayMaya API
        const requestBody = {
          totalAmount: {
            value: order.amount,
            currency: "PHP",
          },
          buyer: {
            firstName: buyerInfo.firstName,
            lastName: buyerInfo.lastName,
            contact: {
              email: buyerInfo.email,
              phone: buyerInfo.phone,
            },
          },
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            amount: {
              value: item.price,
            },
            totalAmount: {
              value: item.price * item.quantity,
            },
          })),
          redirectUrl: {
            success: `${frontend_url}/verify?success=true&orderId=${order._id}`,
            failure: `${frontend_url}/verify?success=false&orderId=${order._id}`,
            cancel: `${frontend_url}/verify?success=cancel&orderId=${order._id}`,
          },
          requestReferenceNumber,
        };
    
        // Make API request to PayMaya
        const response = await axios.post(payMayaApiUrl, requestBody, { headers });
    
        // Return the checkout URL to redirect the user
        return response.data.checkoutUrl;
    
      } catch (error) {
        console.error("Error creating PayMaya checkout session:", error.response ? error.response.data : error);
        throw new Error("PayMaya checkout session failed");
      }
    };
    
    const PlaceOrder = async (req, res) => {
      const frontend_url = 'tienda-frontend-sandy.vercel.app';
    
      try {

        const requestReferenceNumber = generateReferenceNumber();
        // Create new order in your database
        const newOrder = new orderModel({
          userId: req.user.id,
          items: req.body.items,
          amount: req.body.amount,
          address: req.body.address,
          referenceNumber: requestReferenceNumber,
          status: "Pending"
        });
    
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });
    
        // Create a PayMaya checkout session
        const checkoutUrl = await createPayMayaCheckout(newOrder, req.body.buyer, requestReferenceNumber);
    
        // Return the checkout URL so the frontend can redirect the user to PayMaya's checkout page
        res.json({ success: true, checkoutUrl, referenceNumber: requestReferenceNumber, orderId: newOrder._id });
    
      } catch (error) {
        console.log("Error placing order:", error);
        res.json({
          success: false,
          message: 'An error occurred while placing your order. Please try again.'
        });
      }
    };

    res.json({ success: true, session_url: session.url })

  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: 'An error occurred while placing your order. Please try again.'
    })
  }
}

const verifyOrder = async (req, res) => {
  const { orderId, success, transactionId } = req.query;

  try {
    // Validate orderId and success
    if (!orderId || !['true', 'false', 'cancel'].includes(success)) {
      return res.status(400).json({ success: false, message: 'Invalid parameters' });
    }

    let updateData;
    let redirectUrl;

    if (success === 'true') {
      // Update the order to mark it as paid
      updateData = { payment: true, status: 'paid' };
      redirectUrl = `/myorders?orderId=${orderId}`;
    } else if (success === 'cancel') {
      // Handle cancel logic
      updateData = { status: 'cancelled' };
      redirectUrl = '/cancel';
    } else {
      // Handle payment failure
      updateData = { status: 'failed' };
      redirectUrl = '/failure';
    }

    // Update order status
    await orderModel.findByIdAndUpdate(orderId, updateData);

    // Save transaction details
    await transactionModel.create({
      date: new Date(),
      name: 'Some Name', // Update with actual user info
      transactionId: transactionId,
      orderId: orderId,
      status: success === 'true' ? 'Paid' : 'Failed',
    });

    // Return success response
    res.json({ success: true, redirectUrl });

  } catch (error) {
    console.log('Error verifying order:', error);
    res.status(500).json({ success: false, message: 'Error processing payment verification.' });
  }
};



// User Orders for Frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.id }); // Use userId to fetch orders

    res.json({
      success: true,
      data: orders // Return the entire order data (including _id and status)
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error fetching orders"
    });
  }
};

/*const Orders = require('../models/Order');

exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await Orders.find({ userId });

    if (!orders) {
      return res.status(404).json({ success: false, message: "No orders found" });
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};*/




// Listing Orders for Admin Panel
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}); // Fetch all orders for admin

    res.json({ 
      success: true, 
      data: orders // Return the order data including the status and _id
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching orders" });
  }
};


// API for Updating Order Status
 const updateStatus = async (req,res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, {status: req.body.status});
    res.json({success:true, message:"Status Updated"})
  } catch (error) {    
    console.log(error);
    res.json({success:false, message:"Error"})
  }
 }

module.exports = { PlaceOrder, verifyOrder, userOrders,listOrders, updateStatus };
