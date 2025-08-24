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
    sellerEmail: '',
    image: null // Changed from images array to single image
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    const maxSizePerFile = 5 * 1024 * 1024; // 5MB per file
    
    setUploadingImage(true);

    // Check file size
    if (file.size > maxSizePerFile) {
      setMessage('Image is too large. Maximum size is 5MB.');
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
      setUploadingImage(false);
      e.target.value = '';
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file.');
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
      setUploadingImage(false);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = {
        id: Date.now(),
        name: file.name,
        data: e.target.result,
        size: file.size
      };
      
      setFormData(prev => ({
        ...prev,
        image: imageData
      }));
      
      setMessage('Image uploaded successfully');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
      setUploadingImage(false);
    };
    
    reader.onerror = () => {
      setMessage('Failed to read the image file');
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
      setUploadingImage(false);
    };
    
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    // Reset file input
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    const { itemName, startingPrice, bidIncrement, duration, sellerName, sellerEmail } = formData;
    
    if (!itemName.trim()) {
      setMessage('Please enter an item name');
      setMessageType('error');
      return false;
    }
    
    if (!startingPrice || parseFloat(startingPrice) <= 0) {
      setMessage('Starting price must be greater than $0.00');
      setMessageType('error');
      return false;
    }
    
    if (!bidIncrement || parseFloat(bidIncrement) <= 0) {
      setMessage('Bid increment must be greater than $0.00');
      setMessageType('error');
      return false;
    }
    
    if (!duration || parseInt(duration) < 1) {
      setMessage('Duration must be at least 1 minute');
      setMessageType('error');
      return false;
    }
    
    if (!sellerName.trim()) {
      setMessage('Please enter your name');
      setMessageType('error');
      return false;
    }
    
    if (!sellerEmail.trim() || !sellerEmail.includes('@')) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setTimeout(() => setMessage(''), 5000);
      return;
    }
    
    setLoading(true);
    setMessage('');

    try {
      // Prepare data for submission - convert single image to array format for backend compatibility
      const submissionData = {
        ...formData,
        images: formData.image ? [formData.image] : [], // Convert single image to array
        startingPrice: parseFloat(formData.startingPrice),
        bidIncrement: parseFloat(formData.bidIncrement),
        duration: parseInt(formData.duration)
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/auctions/create`,
        submissionData
      );

      if (response.data.success) {
        setMessage(`Auction created successfully! Your auction ID is: ${response.data.auction.id}`);
        setMessageType('success');
        setFormData({
          itemName: '',
          description: '',
          startingPrice: '',
          bidIncrement: '',
          duration: '',
          sellerName: '',
          sellerEmail: '',
          image: null
        });
        // Reset file input
        const fileInput = document.getElementById('imageUpload');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      setMessage('Failed to create auction. Please check your connection and try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 8000);
    }
  };

  const durationOptions = [
    { value: '5', label: '5 minutes (Quick Test)' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour (Recommended)' },
    { value: '120', label: '2 hours' },
    { value: '180', label: '3 hours' },
    { value: '360', label: '6 hours' },
    { value: '720', label: '12 hours' },
    { value: '1440', label: '24 hours (Maximum)' }
  ];

  return (
    <div className="form-container">
      <div className="form-header">
        <h1 className="form-title">Create Professional Auction</h1>
        <p className="form-subtitle">
          List your items on our global marketplace and connect with serious buyers worldwide
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {/* Item Information Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">ITEM</div>
              <span>Item Information</span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter a clear, descriptive title for your item"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Provide comprehensive details about your item's condition, history, specifications, and any relevant information that would help potential buyers make informed decisions..."
                rows="5"
              />
            </div>

            {/* Single Image Upload Section */}
            <div className="form-group">
              <label className="form-label">Item Image (Optional)</label>
              <div className="image-upload-container">
                {!formData.image ? (
                  <>
                    <input
                      type="file"
                      id="imageUpload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="image-upload-input"
                      disabled={uploadingImage}
                    />
                    <label htmlFor="imageUpload" className="image-upload-button">
                      {uploadingImage ? (
                        <>
                          <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }}></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          📸 Upload Image
                        </>
                      )}
                    </label>
                    <div className="upload-info">
                      Max 5MB. Supported formats: JPG, PNG, GIF, WebP
                    </div>
                  </>
                ) : (
                  <div className="single-image-preview">
                    <div className="image-preview-container">
                      <img src={formData.image.data} alt={formData.image.name} className="preview-image-single" />
                      <div className="image-overlay">
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={removeImage}
                          title="Remove image"
                        >
                          ×
                        </button>
                        <button
                          type="button"
                          className="change-image-btn"
                          onClick={() => document.getElementById('imageUpload').click()}
                          title="Change image"
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                    <div className="image-details">
                      <div className="image-name">{formData.image.name}</div>
                      <div className="image-size">{(formData.image.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    {/* Hidden input for changing image */}
                    <input
                      type="file"
                      id="imageUpload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="image-upload-input"
                      disabled={uploadingImage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Configuration Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">$</div>
              <span>Pricing Configuration</span>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Starting Price (USD) *</label>
                <div className="currency-input">
                  <input
                    type="number"
                    name="startingPrice"
                    value={formData.startingPrice}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                  />
                  <span className="currency-symbol">$</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Minimum Bid Increment (USD) *</label>
                <div className="currency-input">
                  <input
                    type="number"
                    name="bidIncrement"
                    value={formData.bidIncrement}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                  />
                  <span className="currency-symbol">$</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Auction Duration *</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select auction duration</option>
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seller Information Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">USER</div>
              <span>Seller Information</span>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your complete name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="sellerEmail"
                  value={formData.sellerEmail}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="your.professional.email@domain.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`message message-${messageType}`}>
              {message}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || uploadingImage}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ 
                    width: '16px', 
                    height: '16px', 
                    marginRight: '8px',
                    marginBottom: '0'
                  }}></div>
                  Creating Auction...
                </>
              ) : (
                'Create Auction'
              )}
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onBack}
              disabled={loading || uploadingImage}
            >
              Cancel
            </button>
          </div>

          {/* Professional Tips */}
          <div className="info-box">
            <div className="info-box-title">
              Professional Auction Tips
            </div>
            <div className="info-box-content">
              <ul>
                <li>Use specific, searchable keywords in your item title</li>
                <li>Include detailed condition reports and specifications</li>
                <li>Upload a high-quality image showing the item clearly</li>
                <li>Set competitive starting prices to encourage initial bidding</li>
                <li>Choose appropriate durations - longer auctions reach more bidders</li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAuction;
