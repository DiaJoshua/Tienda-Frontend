import React, { useState, useEffect } from "react";
import "./ChangePassword.css";
import axios from "axios";
import { toast } from "react-toastify";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  let fetchedUser = null;
  let oldPasswordCheck = false;

  const getUserIdFromToken = () => {
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      const payload = JSON.parse(atob(authToken.split(".")[1]));
      return payload.user.id;
    }
    return null;
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    const userId = getUserIdFromToken();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const userResponse = await fetch(
        `tienda-backend-gold.vercel.app/fetchuser/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const fetchedUser = await userResponse.json();

      if (oldPassword !== fetchedUser.password) {
        toast.error("Incorrect password");
        return;
      }
      toast.success("Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      const updateResponse = await fetch(
        `tienda-backend-gold.vercel.app/updatepassword/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: newPassword }),
        }
      );

      if (updateResponse.ok) {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errorData = await updateResponse.json();
        toast.error(errorData.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while changing the password.");
    }
  };

  return (
    <div className="change-password">
      <div className="change-password-container">
        <h1 className="change-password__heading">Change Password</h1>

        <form className="change-password__form" onSubmit={handleSaveChanges}>
          <div className="change-password__form-group">
            <label htmlFor="oldpass">
              Old Password <span>*</span>
            </label>
            <input
              type="password"
              id="oldpass"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              aria-required="true"
            />
          </div>

          <div className="change-password__form-group">
            <label htmlFor="newpass">
              New Password <span>*</span>
            </label>
            <input
              type="password"
              id="newpass"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-required="true"
            />
          </div>

          <div className="change-password__form-group">
            <label htmlFor="confirmpass">
              Confirm Password <span>*</span>
            </label>
            <input
              type="password"
              id="confirmpass"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-required="true"
            />
          </div>

          <button className="change-password__button" type="submit">
            Save Changes
          </button>
        </form>

        {message && <p className="change-password__message">{message}</p>}
      </div>
    </div>
  );
};

export default ChangePassword;
