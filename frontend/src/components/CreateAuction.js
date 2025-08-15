import React, { useState } from 'react';
import axios from 'axios';

// API base URL - use relative URL for production, localhost for development
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000')
  : '';  // Empty string for production (same domain)

const CreateAuction = ({ onBack }) => {
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    startingPrice: '',
    bidIncrement: '',
    duration: '',
    sellerName: '',
    sellerEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auctions/create`,
        {
          ...formData,
          startingPrice: parseFloat(formData.startingPrice),
          bidIncrement: parseFloat(formData.bidIncrement),
          duration: parseInt(formData.duration)
        }
      );

      if (response.data.success) {
        setMessage(`Auction created successfully! Auction ID: ${response.data.auction.id}`);
        setFormData({
          itemName: '',
          description: '',
          startingPrice: '',
          bidIncrement: '',
          duration: '',
          sellerName: '',
          sellerEmail: ''
        });
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      setMessage('Error creating auction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Create New Auction</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Item Name:</label>
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Starting Price ($):</label>
          <input
            type="number"
            name="startingPrice"
            value={formData.startingPrice}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label>Bid Increment ($):</label>
          <input
            type="number"
            name="bidIncrement"
            value={formData.bidIncrement}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label>Duration (minutes):</label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label>Your Name:</label>
          <input
            type="text"
            name="sellerName"
            value={formData.sellerName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Your Email:</label>
          <input
            type="email"
            name="sellerEmail"
            value={formData.sellerEmail}
            onChange={handleChange}
            required
          />
        </div>

        {message && (
          <div className={message.includes('Error') ? 'error' : 'success'}>
            {message}
          </div>
        )}

        <div className="form-buttons">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Auction'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Back to Home
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAuction;
