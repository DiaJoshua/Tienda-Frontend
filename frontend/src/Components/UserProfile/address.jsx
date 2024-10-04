import React, { useState, useEffect } from "react";
import "./address.css";
import axios from "axios";
import 'react-toastify/dist/ReactToastify.css';
import { regions, provincesByCode, cities, barangays } from 'select-philippines-address';

const Address = () => {
  const [userData, setUserData] = useState(null); // Define userData and setUserData
  const [formData, setFormData] = useState({
    street: "",
    barangay: "",
    municipality: "",
    province: "",
    region: "",
    zip: "",
    country: "Philippines",
  });

  const [availableRegions, setAvailableRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [citiesList, setCities] = useState([]);
  const [barangaysList, setBarangays] = useState([]);
  const [restoreData, setRestoreData] = useState(""); // For restoring and updating the data

  // Store selected names to display in restore data
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");

    // Additional States for Validation and Submission Feedback
    const [formErrors, setFormErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

  // Fetch regions on component mount
  useEffect(() => {
    const fetchRegions = async () => {
      const data = await regions();
      setAvailableRegions(data);
    };

    fetchRegions();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken"); // Ensure you store and retrieve the token properly
        const response = await axios.get("tienda-backend-gold.vercel.app/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Assuming the response contains the user data, set it in state
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
  
    fetchUserData();
  }, []);
  

  // Fetch provinces when region is selected
  useEffect(() => {
    const fetchProvinces = async () => {
      if (formData.region) {
        const provincesData = await provincesByCode(formData.region);
        setProvinces(provincesData);

        // Find the selected region name
        const selectedRegionData = availableRegions.find(
          (region) => region.region_code === formData.region
        );
        setSelectedRegion(selectedRegionData?.region_name || "");
      }
    };

    fetchProvinces();
  }, [formData.region]);

  // Fetch cities when a province is selected
  useEffect(() => {
    const fetchCities = async () => {
      if (formData.province) {
        const citiesData = await cities(formData.province);
        setCities(citiesData);

        // Find the selected province name
        const selectedProvinceData = provinces.find(
          (province) => province.province_code === formData.province
        );
        setSelectedProvince(selectedProvinceData?.province_name || "");
      }
    };

    fetchCities();
  }, [formData.province]);

  // Fetch barangays when a city is selected
  useEffect(() => {
    const fetchBarangays = async () => {
      if (formData.municipality) {
        const barangaysData = await barangays(formData.municipality);
        setBarangays(barangaysData);

        // Find the selected city name
        const selectedCityData = citiesList.find(
          (city) => city.city_code === formData.municipality
        );
        setSelectedCity(selectedCityData?.city_name || "");
      }
    };

    fetchBarangays();
  }, [formData.municipality]);

  // Find selected barangay name
  useEffect(() => {
    const selectedBarangayData = barangaysList.find(
      (barangay) => barangay.brgy_code === formData.barangay
    );
    setSelectedBarangay(selectedBarangayData?.brgy_name || "");
  }, [formData.barangay]);

  // Update the restore data field based on current form values (actual names)
  useEffect(() => {
    setRestoreData(
      `${formData.street}, ${selectedRegion}, ${selectedProvince}, ${selectedCity}, ${selectedBarangay}, ${formData.zip}`
    );
  }, [formData, selectedRegion, selectedProvince, selectedCity, selectedBarangay]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const errors = {};
  
    if (!formData.street.trim()) {
      errors.street = "Street is required.";
    }
    if (!formData.region) {
      errors.region = "Region is required.";
    }
    if (!formData.province) {
      errors.province = "Province is required.";
    }
    if (!formData.municipality) {
      errors.municipality = "City/Municipality is required.";
    }
    if (!formData.barangay) {
      errors.barangay = "Barangay is required.";
    }
    if (!formData.zip.trim()) {
      errors.zip = "Zip Code is required.";
    } else if (!/^\d{4}$/.test(formData.zip)) {
      errors.zip = "Zip Code must be 4 digits.";
    }
  
    // You can add more validation rules as needed
  
    // Update state with errors if you choose to display them
    setFormErrors(errors);
  
    return Object.keys(errors).length === 0;
  };

  const [submissionStatus, setSubmissionStatus] = useState(null); // null, 'success', 'error'
  const [submissionMessage, setSubmissionMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true); // <-- Start loading
      try {
        const userId = localStorage.getItem('userId');
        console.log('Updating user with ID:', userId);
        if (!userId) {
          console.error('User ID is null or undefined');
          setSubmissionStatus('error');
          setSubmissionMessage('User ID is missing.');
          setIsLoading(false); // <-- Stop loading if error
          return;
        }
  
        console.log("Form Data: ", formData); // <-- Debug form data
  
        const response = await axios.patch('tienda-backend-gold.vercel.app/api/edituser/address', {
          userId,
          addressData: formData
        });
  
        console.log('Address updated successfully:', response.data);
        setSubmissionStatus('success');
        setSubmissionMessage('Address updated successfully.');
      } catch (error) {
        console.error('Error updating address:', error);
        console.log("Error data: ", error.response ? error.response.data : error); // <-- Debug error response
        setSubmissionStatus('error');
        setSubmissionMessage('Failed to update address.');
      } finally {
        setIsLoading(false); // <-- Stop loading
      }
    }
  };
  


  const handleRestore = () => {
    try {
      const [street, regionName, provinceName, cityName, barangayName, zip] = restoreData.split(",").map(item => item.trim());
      if (!street || !regionName || !provinceName || !cityName || !barangayName || !zip) {
        throw new Error("Incomplete address data.");
      }

      const region = availableRegions.find((region) => region.region_name.toLowerCase() === regionName.toLowerCase())?.region_code || "";
      const province = provinces.find((province) => province.province_name.toLowerCase() === provinceName.toLowerCase())?.province_code || "";
      const municipality = citiesList.find((city) => city.city_name.toLowerCase() === cityName.toLowerCase())?.city_code || "";
      const barangay = barangaysList.find((barangay) => barangay.brgy_name.toLowerCase() === barangayName.toLowerCase())?.brgy_code || "";

      if (!region || !province || !municipality || !barangay) {
        throw new Error("Invalid address components.");
      }

      setFormData({
        street,
        region,
        province,
        municipality,
        barangay,
        zip,
        country: "Philippines"
      });

      setSubmissionStatus(null);
      setSubmissionMessage("");
      setFormErrors({});
    } catch (error) {
      console.error("Error restoring address:", error);
      setSubmissionStatus("error");
      setSubmissionMessage("Failed to restore address. Please check the format.");
    }
  };

  return (
    <div className="address-form">
      <h1>New Address</h1>

      {/* Input box to show and restore previously selected/typed values */}
      <div className="form-row">
        <input
          type="text"
          placeholder="street, region, province, city, barangay, zip"
          value={restoreData}
          onChange={(e) => setRestoreData(e.target.value)}
        />
        <button type="button" onClick={handleRestore}>Restore</button>
      </div>

      {/* Submission Status Message */}
      {submissionStatus && (
        <div className={`submission-message ${submissionStatus}`}>
          {submissionMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Street */}
        <div className="form-row">
          <input
            type="text"
            name="street"
            placeholder="Street"
            value={formData.street}
            onChange={handleChange}
          />
          {formErrors.street && <span className="error">{formErrors.street}</span>}
        </div>

        {/* Region */}
        <div className="form-row">
          <select
            name="region"
            value={formData.region}
            onChange={handleChange}
          >
            <option value="">Region</option>
            {availableRegions.map((region) => (
              <option key={region.region_code} value={region.region_code}>
                {region.region_name}
              </option>
            ))}
          </select>
          {formErrors.region && <span className="error">{formErrors.region}</span>}
        </div>

        {/* Province */}
        <div className="form-row">
          <select
            name="province"
            value={formData.province}
            onChange={handleChange}
            disabled={!formData.region}
          >
            <option value="">Province</option>
            {provinces.map((province) => (
              <option key={province.province_code} value={province.province_code}>
                {province.province_name}
              </option>
            ))}
          </select>
          {formErrors.province && <span className="error">{formErrors.province}</span>}
        </div>

        {/* City */}
        <div className="form-row">
          <select
            name="municipality"
            value={formData.municipality}
            onChange={handleChange}
            disabled={!formData.province}
          >
            <option value="">City/Municipality</option>
            {citiesList.map((city) => (
              <option key={city.city_code} value={city.city_code}>
                {city.city_name}
              </option>
            ))}
          </select>
          {formErrors.municipality && <span className="error">{formErrors.municipality}</span>}
        </div>

        {/* Barangay */}
        <div className="form-row">
          <select
            name="barangay"
            value={formData.barangay}
            onChange={handleChange}
            disabled={!formData.municipality}
          >
            <option value="">Barangay</option>
            {barangaysList.map((barangay) => (
              <option key={barangay.brgy_code} value={barangay.brgy_code}>
                {barangay.brgy_name}
              </option>
            ))}
          </select>
          {formErrors.barangay && <span className="error">{formErrors.barangay}</span>}
        </div>

        {/* Zip Code */}
        <div className="form-row">
          <input
            type="text"
            name="zip"
            placeholder="Zip Code"
            value={formData.zip}
            onChange={handleChange}
          />
          {formErrors.zip && <span className="error">{formErrors.zip}</span>}
        </div>

        {/* Country */}
        <div className="form-row">
          <input
            type="text"
            name="country"
            placeholder="Country"
            value={formData.country}
            disabled
          />
        </div>

        {/* Submit Button */}
        <div className="form-row">
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Address;
