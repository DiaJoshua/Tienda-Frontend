import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../../Context/ShopContext";
import "./PlaceOrder.css";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";  // useLocation for URL
import axios from "axios";
import { regions, provincesByCode, cities, barangays } from 'select-philippines-address';
//import { v4 as uuidv4 } from "uuid";

const generateReferenceNumber = () => {
  // Using timestamp + random number for simplicity
  return `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const getUserIdFromToken = () => {
  const authToken = localStorage.getItem("auth-token");
  if (authToken) {
    const payload = JSON.parse(atob(authToken.split(".")[1]));
    return payload.user.id;
  }
  return null;
};

const MAIN_OFFICE_COORDINATES = {
  latitude: 14.628488,  // Sunnymede IT Center latitude
  longitude: 121.033420
};

export const PlaceOrder = () => {
  const { getTotalCartAmount, all_product, cartItems } =
    useContext(ShopContext);
  const token = localStorage.getItem("auth-token");
  const navigate = useNavigate();
  const location = useLocation();
  
  const [transactionId, setTransactionId] = useState(null);
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
    size: "",
    provinceCode: "", // Add a state to hold the selected province code
    provinces: [],
  });

  const [deliveryFee, setDeliveryFee] = useState(0);
  

   // Fetch user data on component mount
     // Fetch user data on component mount
     useEffect(() => {
      const fetchUserData = async () => {
        try {
          const response = await axios.get("tienda-backend-gold.vercel.app/api/users", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const allUsersData = response.data;
          const loggedInUserId = localStorage.getItem("userId");
    
          const loggedInUser = allUsersData.find(user => user._id === loggedInUserId);
    
          if (loggedInUser) {
            // Extracting address details
            const { barangay, municipality, province, region, street, zip, country } = loggedInUser.address;
    
            // Get names from the imported data
            const barangayName = await barangays(municipality); 
            const cityData = await cities(province); // Replace with province_code or id
            //const regionsData = await regions();
            const provincesData = await provincesByCode(region); 
                    // Debugging Logs
        console.log('Province Data:', provincesData);  // See the structure of the provinceData array
        console.log('Province Code:', province);
            
                    // Assuming these functions return arrays, map the correct names
        const selectedBarangay = barangayName.find(b => b.brgy_code === barangay)?.brgy_name || "";
        const selectedCity = cityData.find(c => c.city_code === municipality)?.city_name || "";
        const selectedProvince = provincesData.find(p => p.province_code === province)?.province_name || "";
        
        console.log('Selected Province:', selectedProvince); 

    
            setData({
              firstName: loggedInUser.name.split(" ")[0] || "",
              lastName: loggedInUser.name.split(" ")[1] || "",
              email: loggedInUser.email || "",
              street: street || "",
              barangay: selectedBarangay || "",
              city: selectedCity || "",
              state: selectedProvince || "",
              zipcode: zip || "",
              country: country || "Philippines",
              phone: loggedInUser.phone || "",
            });
            
          } else {
            console.error("Logged-in user not found.");
            toast.error("Error fetching logged-in user's data.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Error fetching user data.");
        }
      };
    
      const fetchProvinceData = async () => {
        try {
          const regionCode = 'some-region-code'; // Replace with the actual region code
          const provincesData = await provincesByCode(regionCode);
          setData(prevData => ({ ...prevData, provinces: provincesData }));
          console.log('Provinces Data:', provincesData);
        } catch (error) {
          console.error('Error fetching province data:', error);
        }
      };
  
      if (token) {
        fetchUserData(); // Call to fetch user data
        fetchProvinceData(); // Fetch province data here
      } else {
        toast.error("Please log in to proceed.");
        navigate("/login");
      }
    }, [token, navigate]);

    const fetchCoordinates = async (address) => {
      const apiKey = process.env.REACT_APP_POSITION_STACK_API_KEY; // Set this in your .env file
      console.log("Position Stack API Key:", apiKey);
      const url = `http://api.positionstack.com/v1/forward?access_key=48ceab57881e0d4b21c7d7c68d31d792&query=${address}`;
  
      try {
        const response = await axios.get(url);
        return {
          latitude: response.data.data[0].latitude,
          longitude: response.data.data[0].longitude,
        };
      } catch (error) {
        console.error("Error fetching coordinates:", error);
        toast.error("Error fetching coordinates.");
        return null;
      }
    };

    const calculateDeliveryFee = async () => {
      const customerAddress = `${data.street}, ${data.city}`;
      const coordinates = await fetchCoordinates(customerAddress);
    
      if (coordinates) {
        const distanceKm = getDistanceFromLatLonInKm(
          MAIN_OFFICE_COORDINATES.latitude,
          MAIN_OFFICE_COORDINATES.longitude,
          coordinates.latitude,
          coordinates.longitude
        );
    
        // Convert distance to miles
        const distanceMiles = distanceKm * 0.621371;
    
        // Determine region (Example: Assuming you know how to identify NCR)
        const isSameRegion = data.state === "Metro Manila" || data.region === "NCR";
    
        // Adjust base fee and fee per mile depending on the region
        let baseFee = isSameRegion ? 20 : 40; // Lower base fee within NCR
        let feePerMile = isSameRegion ? 2 : 3; // Lower fee per mile within NCR
    
        let totalFee = baseFee + feePerMile * Math.ceil(distanceMiles);
    
        // Capping the delivery fee to avoid extreme values
        const maxDeliveryFee = isSameRegion ? 100 : 200; // Lower cap for same region
        totalFee = totalFee > maxDeliveryFee ? maxDeliveryFee : totalFee;
    
        setDeliveryFee(totalFee);
      }
    };
    
  
    const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the Earth in km
      const dLat = degreesToRadians(lat2 - lat1);
      const dLon = degreesToRadians(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    };
  
    const degreesToRadians = (degrees) => {
      return degrees * (Math.PI / 180);
    };
  
    useEffect(() => {
      if (data.street && data.city) {
        calculateDeliveryFee();
      }
    }, [data.street, data.city]);
    

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  // async function submitOrder(orderData) {
  //   try {
  //     const response = await axios.post(
  //       `tienda-backend-gold.vercel.app/api/orderedItems/`,
  //       orderData
  //     );
  //     console.log("Order created successfully:", response.data);
  //   } catch (error) {
  //     console.error("Error creating order:", error);
  //   }
  // }

  const handleProceedToCheckout = async () => {
    if (token) {
      const requestReferenceNumber = generateReferenceNumber(); // This is your transaction ID
      console.log("Generated Transaction ID:", requestReferenceNumber);
      const cartDetails = Object.keys(cartItems)
      .filter(key => {
        const [itemId, size] = key.split("_");
        return all_product.some(product => product.id === parseInt(itemId));
      })
      .map(key => {
        const [itemId, size] = key.split("_");
        const product = all_product.find(product => product.id === parseInt(itemId));
        return {
          id: product.id,
          name: product.name,
          price: cartItems[key].price,
          quantity: cartItems[key].quantity,
          size: size
        };
      });

    console.log("Cart Details:", cartDetails); // Ensure this logs correctly

      const mayaApiUrl = "https://pg-sandbox.paymaya.com/checkout/v1/checkouts";

      const secretKey = process.env.REACT_APP_CHECKOUT_PUBLIC_API_KEY;
      if (!secretKey) {
        toast.error(
          "Missing API Key. Please check the environment configuration."
        );
        return;
      }

      const encodedKey = btoa(`${secretKey}:`);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedKey}`,
      };

      const requestBody = {
        totalAmount: {
          value: getTotalCartAmount() + deliveryFee,
          currency: "PHP",
        },
        buyer: {
          firstName: data.firstName,
          lastName: data.lastName,
          contact: {
            email: data.email,
            phone: data.phone,
          },
        },
        items: [
          ...cartDetails.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            amount: {
              value: item.price,
            },
            totalAmount: {
              value: item.price * item.quantity,
            },
          })),
          {
            name: "Delivery Fee", // Name for delivery fee item
            amount: {
              value: deliveryFee,
            },
            totalAmount: {
              value: deliveryFee,
            },
          }
        ],
        redirectUrl: {
          success: `tienda-frontend-sandy.vercel.app/myorders?orderId=${requestReferenceNumber}`,
          failure: `tienda-frontend-sandy.vercel.app/myorders?orderId=${requestReferenceNumber}`,
          cancel: `tienda-frontend-sandy.vercel.app/myorders?orderId=${requestReferenceNumber}`,
        },
      requestReferenceNumber,
      };

      try {
        console.log("Request Headers:", headers);
        console.log("Request Body:", requestBody);

        const response = await axios.post(mayaApiUrl, requestBody, { headers });
        if (response.data && response.data.redirectUrl) {
          console.log("Redirecting to PayMaya:", response.data.redirectUrl);
          // Redirect to the PayMaya checkout page
          window.location.href = response.data.redirectUrl;

          // Reuse the existing cartDetails array before making the PayMaya request
          const totalQuantity = cartDetails.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = cartDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const itemNames = cartDetails.map(item => item.name).join(', ');

          
          const saveTransaction = async (transactionDetails) => {
            console.log("Saving Transaction Details:", transactionDetails); 
            try {
              await axios.post('tienda-backend-gold.vercel.app/api/transactions', transactionDetails);
              console.log("Transaction saved:", transactionDetails);
            } catch (error) {
              console.error("Error saving transaction:", error.response ? error.response.data : error.message);
            }
          };
          const userId = localStorage.getItem('userId'); 
          saveTransaction({
            transactionId: requestReferenceNumber,  // Pass the requestReferenceNumber here instead
            date: new Date(),
            name: `${data.firstName} ${data.lastName}`,
            contact: data.phone,  // Adjusted contact format
            item: itemNames,      // Concatenated item names
            quantity: totalQuantity,
            amount: totalAmount,
            address: `${data.street} ${data.city} ${data.state} ${data.zipcode} ${data.country}`,
            status: 'Paid',
            userId: userId // Include userId here
          });

          const updateStock = async () => {
            try {
              const stockUpdates = cartDetails.map(item => ({
                id: item.id.toString(), 
                size: item.size,
                quantity: item.quantity
              }));
              await axios.post('tienda-backend-gold.vercel.app/api/updateStock', { updates: stockUpdates });
              console.log("Stock updated successfully");
            } catch (error) {
              console.error("Error updating stock:", error.response ? error.response.data : error.message);
              toast.error("Failed to update stock");
            }
          };
  
          updateStock();
          
        } else {
          console.error("Checkout Response Error:", response.data);
          toast.error("Checkout failed, please try again.");
        }
      } catch (error) {
        console.error(
          "Error during Maya checkout:",
          error.response ? error.response.data : error
        );
        toast.error(`Checkout failed: ${error.message}`);
      }
    } else {
      toast.error(
        "You are not logged in. Please log in to proceed to checkout."
      );
      navigate("/login");
    }
  };

  useEffect(() => {
    if (getTotalCartAmount() === 0) {
      navigate("/cart");
    }
  }, [navigate, getTotalCartAmount]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search); // Get the query parameters from the URL
    const id = searchParams.get("orderId");  // Extract the 'orderId' parameter from the URL
    if (id) {
      console.log("Transaction ID from URL:", id);  // Ensure this logs correctly
      setTransactionId(id); // Set the extracted id in state
    } else {
      console.error("No Transaction ID found in URL");
    }
  }, [location]);
  

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleProceedToCheckout();
      }}
      className="place-order"
    >
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input
            required
            name="firstName"
            onChange={onChangeHandler}
            value={data.firstName}
            type="text"
            placeholder="First Name"
          />
          <input
            required
            name="lastName"
            onChange={onChangeHandler}
            value={data.lastName}
            type="text"
            placeholder="Last Name"
          />
        </div>
        <input
          required
          name="email"
          onChange={onChangeHandler}
          value={data.email}
          type="email"
          placeholder="Email Address"
        />
        <input
          required
          name="street"
          onChange={onChangeHandler}
          value={data.street}
          type="text"
          placeholder="Street"
        />
        <div className="multi-fields">
          <input
            required
            name="city"
            onChange={onChangeHandler}
            value={data.barangay}
            type="text"
            placeholder="City"
          />
          <input
            required
            name="state"
            onChange={onChangeHandler}
            value={data.city}
            type="text"
            placeholder="State"
          />
        </div>
        <div className="multi-fields">
          <input
            required
            name="province"
            onChange={onChangeHandler}
            value={data.state}
            type="text"
            placeholder="Province"
          />
          <input
            required
            name="country"
            onChange={onChangeHandler}
            value={data.country}
            type="text"
            placeholder="Country"
          />
        </div>
        <div className="multi-fields">
        <input
            required
            name="zipcode"
            onChange={onChangeHandler}
            value={data.zipcode}
            type="text"
            placeholder="Zip Code"
          />
        <input
          required
          name="phone"
          onChange={onChangeHandler}
          value={data.phone}
          type="text"
          placeholder="Phone"
        />
        </div>
      </div>
      <div className="place-order-right">
        <div className="cartitems-total">
          <h1>Cart Totals</h1>
          <div>
            <div className="cartitems-total-item">
              <p>Subtotal</p>
              <p>₱{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <p>Delivery Fee</p>
              <p> ₱{deliveryFee}</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <h3>Total</h3>
              <h3>
                ₱{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + deliveryFee}
              </h3>
            </div>
          </div>
          <button type="submit">PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
