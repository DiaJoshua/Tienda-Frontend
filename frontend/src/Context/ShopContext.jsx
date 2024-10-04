import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
export const ShopContext = createContext(null);

const getDefaultCart = () => {
  let cart = {};
  for (let index = 0; index < 300 + 1; index++) {
    cart[index] = { quantity: 0, size: "", price: 0 };
  }
  return cart;
};

const ShopContextProvider = (props) => {
  const [all_product, setAll_Product] = useState([]);
  const [cartItems, setCartItems] = useState(getDefaultCart());
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [users, setUser] = useState(null);

  const calculateDeliveryFee = (distance) => {
    // Example logic for delivery fee
    const baseFee = 50; // Base delivery fee
    const perKmRate = 10; // Rate per kilometer
    const fee = baseFee + perKmRate * distance;
    setDeliveryFee(fee);
  };

  const getUserDetails = async () => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      try {
        const response = await axios.get('/api/user', { headers: { Authorization: `Bearer ${token}` } });
        setUser(response.data);
        return response.data; // Return user data
      } catch (error) {
        console.error("Error fetching user details:", error);
        return null; // Handle error accordingly
      }
    }
    return null; // If no token, return null
  };


  useEffect(() => {
    fetch("tienda-backend-gold.vercel.app/allproducts")
      .then((response) => response.json())
      .then((data) => setAll_Product(data));

    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("tienda-backend-gold.vercel.app/getcart", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `${authToken}`,
          "Content-Type": "application/json",
        },
        body: "",
      })
        .then((response) => response.json())
        .then((data) => setCartItems(data));
    }
  }, []);

  const fetchAllProducts = async () => {
    try {
      const response = await fetch("tienda-backend-gold.vercel.app/allproducts");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const allProducts = await response.json();
      return allProducts;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  const prepareOrderItems = async (cartItems) => {
    const allProducts = await fetchAllProducts();
    console.log("Cart Items:", cartItems); // Debugging line
    console.log("All Products:", allProducts); // Debugging line

    let orderItems = [];
    allProducts.forEach((item) => {
      if (cartItems[item._id] && cartItems[item._id].quantity > 0) {
        let itemInfo = { ...item };
        itemInfo["quantity"] = cartItems[item._id].quantity;
        itemInfo["size"] = cartItems[item._id].size;
        itemInfo["price"] = cartItems[item._id].price;
        orderItems.push(itemInfo);
      }
    });
    console.log("Order Items:", orderItems);
    return orderItems;
  };

  const addToCart = (itemId, size, price, quantity) => {
    const cartKey = `${itemId}_${size}`; // Use itemId and size as key
    setCartItems((prev) => ({
      ...prev,
      [cartKey]: {
        quantity: (prev[cartKey]?.quantity || 0) + quantity,
        size: size,
        price: price,
      },
    }));
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("tienda-backend-gold.vercel.app/addtocart", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, size, price, quantity }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          console.log(data);
        })
        .catch((error) => {
          console.error("There was a problem with the fetch operation:", error);
        });
    }
  };

  const updateQuantity = (id, quantity) => {
    setCartItems((prevCartItems) => ({
      ...prevCartItems,
      [id]: {
        ...prevCartItems[id],
        quantity: quantity,
      },
    }));
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => {
      const newQuantity = (prev[itemId]?.quantity || 0) - 1;
      return {
        ...prev,
        [itemId]: {
          quantity: newQuantity > 0 ? newQuantity : 0,
          size: prev[itemId]?.size || "",
          price: prev[itemId]?.price || 0,
        },
      };
    });
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("tienda-backend-gold.vercel.app/removefromcart", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      })
        .then((response) => response.json())
        .then((data) => console.log(data));
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item].quantity > 0) {
        totalAmount += cartItems[item].price * cartItems[item].quantity;
      }
    }
    return totalAmount;
  };

  const getTotalCartItems = () => {
    let totalItem = 0;
    for (const item in cartItems) {
      if (cartItems[item].quantity > 0) {
        totalItem += cartItems[item].quantity;
      }
    }
    return totalItem;
  };

  const contextValue = {
    getTotalCartAmount,
    getTotalCartItems,
    deliveryFee, // Add delivery fee to context
    all_product,
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    prepareOrderItems,
    calculateDeliveryFee, 
    getUserDetails,
    users,
  };
  

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
