import React, { useState, useEffect } from "react";
import "./AccountSettings.css";
import axios from "axios";

const AccountSettings = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const getUserIdFromToken = () => {
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      const payload = JSON.parse(atob(authToken.split(".")[1]));
      return payload.user.id;
    }
    return null;
  };

  const [formErrors, setFormErrors] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  useEffect(() => {
    const authToken = localStorage.getItem("auth-token");

    if (!authToken) {
      console.error("No token found");
      return;
    }

    console.log("authToken", authToken);
    fetch("tienda-backend-gold.vercel.app/api/users", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
        });
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.phone) errors.phone = "Phone is required";
    if (!formData.email) errors.email = "Email is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const userId = getUserIdFromToken();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setFormSubmitted(true);
      try {
        const response = await axios.patch(
          `tienda-backend-gold.vercel.app/api/edituser/${userId}`,
          { name: formData.name, email: formData.email, phone: formData.phone }
        );
        console.log("User updated successfully:", response.data);
      } catch (error) {
        console.error("Error updating user:", error);
      }
    }
  };

  return (
    <div className="account-settings">
      <div className="account-settings-container">
        <h1 className="account-settings__heading">Personal Information</h1>

        {formSubmitted && (
          <p className="account-settings__success">
            Changes saved successfully!
          </p>
        )}

        <form className="account-settings__form" onSubmit={handleSubmit}>
          <div className="account-settings__form-group">
            <label htmlFor="name">
              Your Name <span>*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              aria-required="true"
            />
            {formErrors.name && (
              <span className="account-settings__error">{formErrors.name}</span>
            )}
          </div>

          <div className="account-settings__form-group">
            <label htmlFor="phone">
              Phone/Mobile <span>*</span>
            </label>
            <input
              type="text"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              aria-required="true"
            />
            {formErrors.phone && (
              <span className="account-settings__error">
                {formErrors.phone}
              </span>
            )}
          </div>

          <div className="account-settings__form-group">
            <label htmlFor="email">
              Email <span>*</span>
            </label>
            <input
              type="text"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              aria-required="true"
            />
            {formErrors.email && (
              <span className="account-settings__error">
                {formErrors.email}
              </span>
            )}
          </div>

          <button className="account-settings__button" type="submit">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSettings;
