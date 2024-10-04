const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");
const multer = require("multer");

const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

// import routes
const adminRoutes = require("./routes/adminRoute");
const orderRouter = require("./routes/orderRoute");
const sellerRouter = require("./routes/sellerRoute");
const userRoutes = require("./routes/userRoute");
const transactionRoutes = require("./routes/transactionRoute");
const productRoute = require("./routes/productRoute");
const { signup } = require("./controllers/sellerController");

require("dotenv").config();

const mongoURI = 'mongodb+srv://dbUser:dbUserPassword@cluster0.fypkkcn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Define the sendEmail function
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        reject(error);
      } else {
        console.log("Email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

app.use(cors({
  origin: "tienda-frontend-sandy.vercel.app"
}));
app.use(express.json());
app.use("/api/transactions", transactionRoutes);
app.use("/api", productRoute);

// Database Connection
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,  // Increase timeout to 30 seconds
    bufferCommands: false  // Disable buffering in case of connection issues
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API Creation
app.get("/", (req, res) => {
  res.send("Express App is Running");
});

/* app.post('/paymaya-checkout', async (req, res) => {
  try {
    const response = await axios.post('https://pg-sandbox.paymaya.com/checkout/v1/checkouts', req.body, {
      headers: {
        Authorization: 'Basic WDdZM2VUdnhLUEY5WWRRZzljdmxhckRzWjdiWUNZdjB3blJHOGVpb215cg==',
        'Content-Type': 'application/json'
      }
    });
    res.send(response.data);
  } catch (error) {
    res.status(500).send(error.response ? error.response.data : { error: 'Something went wrong' });
  }
});*/

app.get("/api/transactions", (req, res) => {
  res.json({ message: "This is the transactions endpoint" });
});

app.listen(port, (error) => {
  if (!error) {
    console.log("Server Running on Port: " + port);
  } else {
    console.log("Error: " + error);
  }
});

// Image Storage Engine
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

// Creating Upload Endpoints for Images
app.use("/images", express.static("upload/images"));

app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `tienda-frontend-sandy.vercel.app/images/${req.file.filename}`,
  });
});

app.post("/api/signup", upload.single("idPicture"), signup);

const CartItems = require("./models/orderedItemsModel");

// Schema for Creating Products
const Product = require("./models/productModels");

// Creating Middleware to fetch user
const fetchUser = require("./middleware/auth");

// Schema Creation for User Model
const Users = require("./models/userModels");

// Schema Creation for Transaction Model
const Transaction = require("./models/transactionModel");

// Creating PlaceOrder Endpoint
app.use("/api/order", orderRouter);

// Seller Login Sign Up Endpoint
app.use("/api/seller", sellerRouter);

// Fetch all users
app.get("/users", async (req, res) => {
  try {
    const users = await Users.find({});
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

//app.post("/api/ordered-items", orderedItemsRouter);
//app.get("/getPaidItems", orderedItemsRouter);
/*app.get("/getOrderedItemsById/:id", async (req, res) => {
  try {
    const orders = await Order.find({});
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});*/
//change password api
app.post("/updatepassword/:id", async (req, res) => {
  const { id } = req.params;
  const { password: password } = req.body;

  const user = await Users.findByIdAndUpdate(id, password);
  console.log(id);
  console.log(password);
  user.password = password;
  await user.save();
});

app.get("/fetchuser/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await Users.findById(id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id + 1;
  } else {
    id = 1;
  }
  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
    s_stock: req.body.s_stock,
    m_stock: req.body.m_stock,
    l_stock: req.body.l_stock,
    xl_stock: req.body.xl_stock,
    stock: req.body.stock,
    description: req.body.description,
  });
  await product.save();
  console.log(product);
  res.json({
    success: true,
    name: req.body.name,
  });
  const {
    name,
    image,
    category,
    new_price,
    old_price,
    s_stock,
    m_stock,
    l_stock,
    xl_stock,
    stock,
    description,
  } = req.body;

  // Log received product data
  console.log("Received Product Data:", {
    name,
    image,
    category,
    new_price,
    old_price,
    s_stock,
    m_stock,
    l_stock,
    xl_stock,
    stock,
    description,
  });
});

// Creating API for deleting Products
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Creating API for getting All Products
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("All Products Fetched");
  res.send(products);
});

// Creating Endpoint for Registering the user
app.post("/signup", async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res
      .status(400)
      .json({ success: false, errors: "Existing User Found" });
  }
  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }
  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  await user.save();

  const data = {
    user: {
      id: user.id,
    },
  };

  const token = jwt.sign(data, "secret_ecom");
  res.json({ success: true, token });
});

// Creating Endpoint for User Login
app.post("/login", async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = {
        user: {
          id: user.id,
        },
      };
      const token = jwt.sign(data, "secret_ecom");
      // Ibalik ang user ID kasama ang token
      res.json({ success: true, token, userId: user._id }); // Idagdag ang user ID dito
    } else {
      res.json({ success: false, errors: "Error: Wrong Password" });
    }
  } else {
    res.json({ success: false, errors: "Error: Wrong Email Address" });
  }
});


// Creating Endpoint for NewCollection Data
app.get("/newcollections", async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("NewCollection Fetched");
  res.send(newcollection);
});

// Creating Endpoint for Popular in Crafts Section
app.get("/popularincrafts", async (req, res) => {
  let products = await Product.find({ category: "crafts" });
  let popular_in_crafts = products.slice(5, 9);
  console.log("Popular in Crafts Fetched");
  res.send(popular_in_crafts);
});

// Creating Endpoint for adding products in CartData
app.post("/addtocart", fetchUser, async (req, res) => {
  console.log("added", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.send("Added");
});

// Creating Endpoint to remove product from CartData
app.post("/removefromcart", fetchUser, async (req, res) => {
  console.log("removed", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0)
    userData.cartData[req.body.itemId] -= 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.send("Removed");
});

// Create Endpoint to get CartData
app.post("/getcart", fetchUser, async (req, res) => {
  console.log("GetCart");
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

// Corrected endpoint to fetch related products based on category
app.get("/relatedproducts/:category", async (req, res) => {
  const category = req.params.category;
  try {
    const relatedProducts = await Product.find({ category });
    console.log("Related Products Fetched");
    res.json(relatedProducts);
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ error: "Failed to fetch related products" });
  }
});

let otpStore = {};

// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service provider (like Gmail)
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password
  },
  tls: {
    rejectUnauthorized: false, // Disable SSL certificate validation
  },
});

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  console.log("Request Body:", req.body);
  // Check if the email is already used
  let check = await Users.findOne({ email });
  if (check) {
    return res
      .status(400)
      .json({ success: false, errors: "Existing User Found" });
  }

  // Generate OTP
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  otpStore[email] = otp;

  // Send OTP via email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending OTP:", error);
      return res
        .status(500)
        .json({ success: false, errors: "Failed to send OTP" });
    }
    console.log("OTP sent:", info.response);
    res.json({ success: true, message: "OTP sent to your email" });
  });
});

// Endpoint to verify OTP and sign up user
app.post("/verify-otp", async (req, res) => {
  const { email, otp, username, password } = req.body;

  // Check if the OTP is valid
  if (otpStore[email] !== otp) {
    return res.status(400).json({ success: false, errors: "Invalid OTP" });
  }

  // Clear OTP after successful verification
  delete otpStore[email];

  // Create user after OTP is verified
  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }
  const user = new Users({
    name: username,
    email,
    password,
    cartData: cart,
  });

  await user.save();

  const data = {
    user: {
      id: user.id,
    },
  };

  const token = jwt.sign(data, "secret_ecom");
  res.json({ success: true, token });
});

// Function to generate a 6-digit OTP

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a number between 100000 and 999999
};
// In your Express.js backend
app.post("/forgot-password", async (req, res) => {
  console.log("Forgot Password route hit");
  const { email } = req.body;

  // Check if email exists in your database
  try {
    // Check if email exists in your database
    const user = await Users.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, errors: "User not found." });
    }

    // Generate OTP
    const otp = generateOTP(); // Function to generate OTP
    user.otp = otp; // Save OTP to user record
    await user.save();

    // Send OTP to the user's email
    await sendEmail(user.email, `Your OTP: ${otp}`);

    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully." });
  } catch (error) {
    console.error("Error processing forgot password request:", error);
    res.status(500).json({ success: false, errors: "Internal server error." });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Check if the OTP is valid
  if (otpStore[email] !== otp) {
    return res.status(400).json({ success: false, errors: "Invalid OTP" });
  }

  // Clear OTP after successful verification
  delete otpStore[email];

  // Update user password
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, errors: "User not found" });
    }
    user.password = newPassword; // Consider hashing the password before saving
    await user.save();
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res
      .status(500)
      .json({ success: false, errors: "Failed to update password" });
  }
});

app.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res
      .status(400)
      .json({ success: false, errors: "Please provide all required fields." });
  }

  try {
    // Find user by email
    const user = await Users.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, errors: "User not found." });
    }

    // Verify OTP (You should implement your own OTP verification logic here)
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, errors: "Invalid OTP." });
    }

    // Update the user's password directly (plain text)
    user.password = newPassword;
    user.otp = null; // Clear OTP after successful reset
    await user.save();

    // Respond with success
    res.json({ success: true, message: "Password successfully reset." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, errors: "Server error." });
  }
});

app.get("/transactions/totalAmount", async (req, res) => {
  try {
    const transactions = await Transaction.find({}); // Fetch all transactions

    if (!transactions.length) {
      return res.json(0); // Return 0 if no transactions
    }

    // Calculate the total amount
    const totalAmount = transactions.reduce((total, Transaction) => {
      return total + Transaction.amount; // Assuming 'amount' is a number
    }, 0);

    res.json(totalAmount); // Return total amount
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

const fetchSalesGrowthRateFromDB = async () => {
  // Simulate a database call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Example data
      const data = [
        { date: "2024-01-01", totalSales: 1000 },
        { date: "2024-01-02", totalSales: 1500 },
        // Add more data here
      ];
      resolve(data);
    }, 1000);
  });
};

app.get("/api/transactions/salesGrowthRate", async (req, res) => {
  try {
    // Fetch sales growth rate data from the database
    const data = await fetchSalesGrowthRateFromDB();
    // Send the data as JSON response
    res.json(data);
  } catch (error) {
    // Log the error and send a 500 Internal Server Error response
    console.error("Error fetching sales growth rate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch('/api/edituser/address', async (req, res) => {
  try {
    const { userId, addressData } = req.body;
    
    // Check if userId and addressData exist
    if (!userId || !addressData) {
      return res.status(400).json({ error: 'Missing userId or addressData' });
    }

    // Perform the update in your database
    const updatedUser = await Users.findByIdAndUpdate(userId, { address: addressData }, { new: true });
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', data: updatedUser });
  } catch (error) {
    console.error(error); // Log the actual error in your server
    res.status(500).json({ error: 'Failed to update user' });
  }
});


// Admin Routes
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRouter);
app.use("/api", userRoutes);
