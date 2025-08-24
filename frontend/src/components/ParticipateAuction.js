import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socketService from '../services/socketService';

// API base URL - use relative URL for production, localhost for development
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000')
  : '';  // Empty string for production (same domain)

const ParticipateAuction = ({ onBack }) => {
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidderName, setBidderName] = useState('');
  const [bidderEmail, setBidderEmail] = useState('');
  const [currentBid, setCurrentBid] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isAuctionEnded, setIsAuctionEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAuctions, setLoadingAuctions] = useState(true);

  useEffect(() => {
    fetchAuctions();
  }, []);

  useEffect(() => {
    if (selectedAuction) {
      const socket = socketService.connect();
      socketService.joinAuction(selectedAuction.id);

      // Calculate time remaining
      const startTime = new Date(selectedAuction.startTime);
      const endTime = new Date(startTime.getTime() + selectedAuction.duration * 60 * 1000);
      const now = new Date();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);

      // Set up timer
      const timer = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(0, endTime - now);
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setIsAuctionEnded(true);
          clearInterval(timer);
        }
      }, 1000);

      // Socket event listeners
      socketService.onNewBid((data) => {
        setCurrentBid(parseFloat(data.bidAmount));
        setMessage(`New bid placed: $${parseFloat(data.bidAmount).toFixed(2)} by ${data.bidderName}`);
        setMessageType('info');
        setTimeout(() => setMessage(''), 5000);
      });

      socketService.onBidError((error) => {
        setMessage(error);
        setMessageType('error');
        setTimeout(() => setMessage(''), 5000);
      });

      socketService.onAuctionEnded((data) => {
        setIsAuctionEnded(true);
        setMessage(`Auction completed! Winner: ${data.winner} with $${parseFloat(data.highestBid).toFixed(2)}`);
        setMessageType('success');
      });

      return () => {
        clearInterval(timer);
        socketService.removeAllListeners();
        socketService.disconnect();
      };
    }
  }, [selectedAuction]);

  const fetchAuctions = async () => {
    try {
      setLoadingAuctions(true);
      const response = await axios.get(`${API_BASE_URL}/api/auctions/active`);
      setAuctions(response.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setMessage('Failed to load auctions. Please try again.');
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoadingAuctions(false);
    }
  };

  const selectAuction = async (auction) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/auctions/${auction.id}`);
      setSelectedAuction(response.data);
      setCurrentBid(parseFloat(response.data.currentHighestBid));
      
      // Check if auction has ended
      const startTime = new Date(response.data.startTime);
      const endTime = new Date(startTime.getTime() + response.data.duration * 60 * 1000);
      const now = new Date();
      if (now >= endTime) {
        setIsAuctionEnded(true);
      }
    } catch (error) {
      console.error('Error fetching auction details:', error);
      setMessage('Failed to load auction details. Please try again.');
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const validateBidForm = () => {
    if (!bidderName.trim()) {
      setMessage('Please enter your name');
      setMessageType('error');
      return false;
    }
    
    if (!bidderEmail.trim() || !bidderEmail.includes('@')) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return false;
    }
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setMessage('Please enter a valid bid amount');
      setMessageType('error');
      return false;
    }
    
    return true;
  };

  const placeBid = () => {
    if (!validateBidForm()) {
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    const bid = parseFloat(bidAmount);
    const minimumBid = parseFloat(currentBid) + parseFloat(selectedAuction.bidIncrement);
    
    if (bid < minimumBid) {
      setMessage(`Bid must be at least $${minimumBid.toFixed(2)}`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    socketService.placeBid({
      auctionId: selectedAuction.id,
      bidAmount: bid,
      bidderEmail,
      bidderName
    });

    setBidAmount('');
    setMessage('Processing your bid...');
    setMessageType('info');
  };

  const formatTime = (milliseconds) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getMinimumBid = () => {
    if (!selectedAuction) return 0;
    return parseFloat(currentBid) + parseFloat(selectedAuction.bidIncrement);
  };

  const getTimeStatus = () => {
    if (timeRemaining <= 0) return 'ended';
    if (timeRemaining < 300000) return 'urgent'; // Less than 5 minutes
    if (timeRemaining < 3600000) return 'soon'; // Less than 1 hour
    return 'active';
  };

  const SingleImageDisplay = ({ image, itemName }) => {
    if (!image) return null;

    return (
      <div className="image-gallery">
        <div className="main-image-container">
          <img 
            src={image.data} 
            alt={itemName}
            className="main-auction-image-single"
          />
        </div>
      </div>
    );
  };

  // Auction Room View
  if (selectedAuction) {
    const minimumBid = getMinimumBid();
    const timeStatus = getTimeStatus();
    // Get the first (and only) image
    const itemImage = selectedAuction.images && selectedAuction.images.length > 0 ? selectedAuction.images[0] : null;
    
    return (
      <div className="auction-room">
        <div className="auction-room-header">
          <h1 className="auction-room-title">Live Auction Room</h1>
        </div>

        <div className="auction-info-card">
          <div className="auction-info-header">
            <div className="auction-details">
              <h3>{selectedAuction.itemName}</h3>
              
              {/* Single Image Display */}
              <SingleImageDisplay 
                image={itemImage} 
                itemName={selectedAuction.itemName}
              />
              
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                {selectedAuction.description}
              </p>
              <div className="seller-info">
                <div className="seller-avatar">
                  {selectedAuction.sellerName.charAt(0).toUpperCase()}
                </div>
                <div className="seller-details">
                  <div className="seller-name">{selectedAuction.sellerName}</div>
                  <div className="seller-role">Verified Seller</div>
                </div>
              </div>
            </div>
            
            <div className="auction-status">
              <div className={`status-badge status-${timeStatus}`}>
                {timeStatus === 'ended' && 'Auction Ended'}
                {timeStatus === 'urgent' && 'Final Minutes'}
                {timeStatus === 'soon' && 'Ending Soon'}
                {timeStatus === 'active' && 'Live Now'}
              </div>
            </div>
          </div>

          <div className="auction-stats">
            <div className="stat-item">
              <div className="stat-label">Bid Increment</div>
              <div className="stat-value">${parseFloat(selectedAuction.bidIncrement).toFixed(2)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Leading Bidder</div>
              <div className="stat-value">
                {selectedAuction.highestBidder || 'No bids yet'}
              </div>
            </div>
          </div>

          <div className={`timer ${timeStatus === 'urgent' ? 'urgent' : ''}`}>
            {timeRemaining > 0 ? (
              <>
                Time Remaining: {formatTime(timeRemaining)}
                {timeStatus === 'urgent' && ' - FINAL MINUTES!'}
              </>
            ) : (
              'AUCTION ENDED'
            )}
          </div>
        </div>

        {!isAuctionEnded && timeRemaining > 0 && (
          <div className="bid-section">
            <h2 className="bid-section-title">Place Your Bid</h2>
            
            <div className="bid-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={bidderName}
                    onChange={(e) => setBidderName(e.target.value)}
                    className="form-input"
                    placeholder="Enter your complete name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    value={bidderEmail}
                    onChange={(e) => setBidderEmail(e.target.value)}
                    className="form-input"
                    placeholder="your.email@domain.com"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Bid Amount (USD) *</label>
                <div className="bid-input-group">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="bid-amount-input"
                    step="0.01"
                    min={minimumBid}
                    placeholder={minimumBid.toFixed(2)}
                  />
                  <span className="bid-currency-symbol">$</span>
                </div>
              </div>
              
              <div className="minimum-bid-info">
                Minimum bid required: <strong>${minimumBid.toFixed(2)}</strong>
              </div>
              
              <button 
                className="btn btn-primary" 
                onClick={placeBid}
                style={{ 
                  width: '100%', 
                  fontSize: '1.2rem', 
                  padding: '18px',
                  background: timeStatus === 'urgent' ? 'var(--error-color)' : 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))'
                }}
              >
                {timeStatus === 'urgent' ? 'PLACE URGENT BID' : 'Place Bid'}
              </button>
            </div>
          </div>
        )}

        {isAuctionEnded && (
          <div className="auction-info-card">
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--text-primary)' }}>
                Auction Completed
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '24px' }}>
                This auction has concluded. If you were the winning bidder, 
                you'll receive a confirmation email with payment instructions.
              </p>
              {selectedAuction.highestBidder && (
                <div style={{ 
                  marginTop: '24px', 
                  padding: '24px', 
                  background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                  borderRadius: 'var(--radius-xl)',
                  border: '2px solid #bbf7d0'
                }}>
                  <div style={{ color: '#166534', fontWeight: '700', fontSize: '1.2rem' }}>
                    Winner: {selectedAuction.highestBidder}
                  </div>
                  <div style={{ color: '#166534', fontWeight: '800', fontSize: '1.8rem', marginTop: '8px' }}>
                    Final Bid: ${currentBid.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`message message-${messageType}`}>
            {message}
          </div>
        )}

        <div className="form-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setSelectedAuction(null)}
          >
            Browse Other Auctions
          </button>
          <button className="btn btn-secondary" onClick={onBack}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Auction List View
  return (
    <div className="form-container">
      <div className="form-header">
        <h1 className="form-title">Active Auctions</h1>
        <p className="form-subtitle">
          Discover unique items and participate in real-time bidding with sellers from around the world
        </p>
      </div>

      {loadingAuctions ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading active auctions...</p>
        </div>
      ) : auctions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔭</div>
          <h3 className="empty-state-title">
            No Active Auctions
          </h3>
          <p className="empty-state-description">
            There are currently no active auctions available. Check back soon for new listings 
            or create your own auction to get started.
          </p>
          <button className="btn btn-primary" onClick={fetchAuctions}>
            Refresh Auctions
          </button>
        </div>
      ) : (
        <div className="auction-list">
          {auctions.map((auction) => {
            const currentBid = parseFloat(auction.currentHighestBid);
            const startingPrice = parseFloat(auction.startingPrice);
            const bidIncrement = parseFloat(auction.bidIncrement);
            
            // Calculate time remaining
            const startTime = new Date(auction.startTime);
            const endTime = new Date(startTime.getTime() + auction.duration * 60 * 1000);
            const now = new Date();
            const timeLeft = Math.max(0, endTime - now);
            
            const timeStatus = timeLeft <= 0 ? 'ended' : 
                             timeLeft < 300000 ? 'urgent' : 
                             timeLeft < 3600000 ? 'soon' : 'active';
            
            // Get the first (and only) image
            const previewImage = auction.images && auction.images.length > 0 ? auction.images[0] : null;
            
            return (
              <div key={auction.id} className="auction-card">
                <div className="auction-card-header">
                  <h3 className="auction-title">{auction.itemName}</h3>
                  
                  {/* Single preview image */}
                  {previewImage && (
                    <div className="auction-card-single-image">
                      <img 
                        src={previewImage.data} 
                        alt={auction.itemName}
                        className="auction-single-preview-image"
                      />
                    </div>
                  )}
                  
                  <p className="auction-description">{auction.description}</p>
                </div>
                
                <div className="auction-card-body">
                  <div className="current-bid">${currentBid.toFixed(2)}</div>
                  
                  <div className="auction-stats">
                    <div className="stat-item">
                      <div className="stat-label">Starting Price</div>
                      <div className="stat-value">${startingPrice.toFixed(2)}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Bid Increment</div>
                      <div className="stat-value">${bidIncrement.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="seller-info">
                    <div className="seller-avatar">
                      {auction.sellerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="seller-details">
                      <div className="seller-name">{auction.sellerName}</div>
                      <div className="seller-role">Verified Seller</div>
                    </div>
                  </div>
                  
                  <div className={`time-status ${timeStatus}`}>
                    {timeLeft > 0 ? `${formatTime(timeLeft)} remaining` : 'Auction ended'}
                  </div>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={() => selectAuction(auction)}
                    disabled={loading || timeLeft <= 0}
                    style={{ width: '100%', fontSize: '1.1rem', marginTop: '16px' }}
                  >
                    {timeLeft <= 0 ? 'Auction Ended' : loading ? 'Loading...' : 'Enter Auction Room'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          Back to Home
        </button>
        <button className="btn btn-primary" onClick={fetchAuctions}>
          Refresh Auctions
        </button>
      </div>
    </div>
  );
};

export default ParticipateAuction;
