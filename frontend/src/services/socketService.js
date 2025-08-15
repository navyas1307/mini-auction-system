import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');
      
      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('Connected to server');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('Disconnected from server');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinAuction(auctionId) {
    if (this.socket) {
      this.socket.emit('joinAuction', auctionId);
    }
  }

  placeBid(bidData) {
    if (this.socket) {
      this.socket.emit('placeBid', bidData);
    }
  }

  onNewBid(callback) {
    if (this.socket) {
      this.socket.on('newBid', callback);
    }
  }

  onBidError(callback) {
    if (this.socket) {
      this.socket.on('bidError', callback);
    }
  }

  onAuctionEnded(callback) {
    if (this.socket) {
      this.socket.on('auctionEnded', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();