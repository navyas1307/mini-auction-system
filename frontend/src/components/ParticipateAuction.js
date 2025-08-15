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
  const [isAuctionEnded, setIsAuctionEnded] = useState(false);

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
        setCurrentBid(parseFloat(data.bidAmount)); // Convert to number
        setMessage(`New bid placed: $${data.bidAmount} by ${data.bidderName}`);
        setTimeout(() => setMessage(''), 3000);
      });

      socketService.onBidError((error) => {
        setMessage(error);
        setTimeout(() => setMessage(''), 3000);
      });

      socketService.onAuctionEnded((data) => {
        setIsAuctionEnded(true);
        setMessage(`Auction ended! Winner: ${data.winner} with $${data.highestBid}`);
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
      const response = await axios.get(`${API_BASE_URL}/api/auctions/active`);
      setAuctions(response.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setMessage('Error loading auctions. Please try again.');
    }
  };

  const selectAuction = async (auction) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auctions/${auction.id}`);
      setSelectedAuction(response.data);
      // Ensure currentBid is a number
      setCurrentBid(parseFloat(response.data.currentHighestBid));
    } catch (error) {
      console.error('Error fetching auction details:', error);
      setMessage('Error loading auction details. Please try again.');
    }
  };

  const placeBid = () => {
    if (!bidderName || !bidderEmail || !bidAmount) {
      setMessage('Please fill in all fields');
      return;
    }

    const bid = parseFloat(bidAmount);
    const minimumBid = parseFloat(currentBid) + parseFloat(selectedAuction.bidIncrement);
    
    if (bid < minimumBid) {
      setMessage(`Bid must be at least $${minimumBid.toFixed(2)}`);
      return;
    }

    socketService.placeBid({
      auctionId: selectedAuction.id,
      bidAmount: bid,
      bidderEmail,
      bidderName
    });

    setBidAmount('');
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate minimum bid safely
  const getMinimumBid = () => {
    if (!selectedAuction) return 0;
    return parseFloat(currentBid) + parseFloat(selectedAuction.bidIncrement);
  };

  if (selectedAuction) {
    const minimumBid = getMinimumBid();
    
    return (
      <div className="auction-room">
        <h2>Auction Room</h2>
        
        <div className="auction-info">
          <h3>{selectedAuction.itemName}</h3>
          <p>{selectedAuction.description}</p>
          <div className="current-bid">Current Highest Bid: ${currentBid}</div>
          <div className="timer">
            Time Remaining: {timeRemaining > 0 ? formatTime(timeRemaining) : 'ENDED'}
          </div>
          {selectedAuction.highestBidder && (
            <p>Leading Bidder: {selectedAuction.highestBidder}</p>
          )}
        </div>

        {!isAuctionEnded && timeRemaining > 0 && (
          <div className="bid-section">
            <h4>Place Your Bid</h4>
            <div className="form-group">
              <label>Your Name:</label>
              <input
                type="text"
                value={bidderName}
                onChange={(e) => setBidderName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="form-group">
              <label>Your Email:</label>
              <input
                type="email"
                value={bidderEmail}
                onChange={(e) => setBidderEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="bid-form">
              <div className="bid-input">
                <label>Bid Amount ($):</label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  step="0.01"
                  min={minimumBid}
                  placeholder={`Minimum: $${minimumBid.toFixed(2)}`}
                />
              </div>
              <button className="btn btn-primary" onClick={placeBid}>
                Place Bid
              </button>
            </div>
            <p className="minimum-bid-info">
              <strong>Minimum bid required: ${minimumBid.toFixed(2)}</strong>
            </p>
          </div>
        )}

        {isAuctionEnded && (
          <div className="auction-info">
            <h3>Auction Ended!</h3>
            <p>This auction has concluded. Check your email if you were the winner!</p>
          </div>
        )}

        {message && (
          <div className={message.includes('Error') || message.includes('must') ? 'error' : 'success'}>
            {message}
          </div>
        )}

        <div className="form-buttons">
          <button className="btn btn-secondary" onClick={() => setSelectedAuction(null)}>
            Back to Auctions
          </button>
          <button className="btn btn-secondary" onClick={onBack}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>Participate in Auctions</h2>
      
      {auctions.length === 0 ? (
        <p>No active auctions available at the moment.</p>
      ) : (
        <div className="auction-list">
          {auctions.map((auction) => (
            <div key={auction.id} className="auction-card">
              <h3>{auction.itemName}</h3>
              <p>{auction.description}</p>
              <div className="current-bid">Current Bid: ${parseFloat(auction.currentHighestBid).toFixed(2)}</div>
              <p>Starting Price: ${parseFloat(auction.startingPrice).toFixed(2)}</p>
              <p>Bid Increment: ${parseFloat(auction.bidIncrement).toFixed(2)}</p>
              <p>Seller: {auction.sellerName}</p>
              <button 
                className="btn btn-primary" 
                onClick={() => selectAuction(auction)}
              >
                Join Auction
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="form-buttons">
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
