import express from 'express';
import { Auction, Bid } from '../models/index.js';
import * as redisService from '../services/redisService.js';

const router = express.Router();

// Create a new auction
router.post('/create', async (req, res) => {
  try {
    const { itemName, description, startingPrice, bidIncrement, duration, sellerName, sellerEmail } = req.body;
    
    // Validate input
    if (!itemName || !startingPrice || !bidIncrement || !duration || !sellerName || !sellerEmail) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const auction = await Auction.create({
      itemName,
      description,
      startingPrice: parseFloat(startingPrice),
      bidIncrement: parseFloat(bidIncrement),
      duration: parseInt(duration),
      sellerName,
      sellerEmail
    });

    // Initialize Redis with starting price (no bidder initially)
    await redisService.setHighestBid(auction.id, startingPrice, null, null);

    // Set timer to end auction
    setTimeout(() => {
      if (global.endAuction) {
        console.log(`⏰ Timer triggered for auction ${auction.id}`);
        global.endAuction(auction.id);
      }
    }, duration * 60 * 1000); // Convert minutes to milliseconds

    console.log(`✅ Created auction ${auction.id} for ${itemName}, duration: ${duration} minutes`);
    res.json({ 
      success: true, 
      auction: auction.toJSON(),
      message: `Auction created successfully! ID: ${auction.id}`
    });
  } catch (error) {
    console.error('❌ Error creating auction:', error);
    res.status(500).json({ error: 'Failed to create auction', details: error.message });
  }
});

// Get all active auctions
router.get('/active', async (req, res) => {
  try {
    const auctions = await Auction.findAll({
      where: { status: 'active' },
      order: [['createdAt', 'DESC']]
    });

    // Get current highest bids from Redis and check if auctions should be ended
    const auctionsWithBids = await Promise.all(
      auctions.map(async (auction) => {
        // Check if auction should be ended
        const startTime = new Date(auction.startTime);
        const endTime = new Date(startTime.getTime() + auction.duration * 60 * 1000);
        const now = new Date();
        
        if (now > endTime && auction.status === 'active') {
          // End the auction if time has passed
          if (global.endAuction) {
            await global.endAuction(auction.id);
          }
          return null; // Don't include ended auctions
        }
        
        const currentBid = await redisService.getCurrentHighestBid(auction.id);
        const bidData = await redisService.getHighestBidData(auction.id);
        
        return {
          ...auction.toJSON(),
          currentHighestBid: currentBid,
          timeRemaining: Math.max(0, endTime - now),
          highestBidder: bidData?.bidderName || null
        };
      })
    );

    // Filter out null values (ended auctions)
    const activeAuctions = auctionsWithBids.filter(auction => auction !== null);

    res.json(activeAuctions);
  } catch (error) {
    console.error('❌ Error fetching auctions:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});

// Get specific auction details
router.get('/:id', async (req, res) => {
  try {
    const auctionId = parseInt(req.params.id);
    if (isNaN(auctionId)) {
      return res.status(400).json({ error: 'Invalid auction ID' });
    }

    const auction = await Auction.findByPk(auctionId);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Check if auction should be ended
    const startTime = new Date(auction.startTime);
    const endTime = new Date(startTime.getTime() + auction.duration * 60 * 1000);
    const now = new Date();
    
    if (now > endTime && auction.status === 'active') {
      // End the auction if time has passed
      if (global.endAuction) {
        await global.endAuction(auction.id);
      }
      // Refresh auction data
      const updatedAuction = await Auction.findByPk(auctionId);
      
      const currentHighestBid = await redisService.getCurrentHighestBid(auction.id);
      const bidData = await redisService.getHighestBidData(auction.id);

      return res.json({
        ...updatedAuction.toJSON(),
        currentHighestBid,
        highestBidder: bidData?.bidderName || null,
        timeRemaining: 0
      });
    }

    const currentHighestBid = await redisService.getCurrentHighestBid(auction.id);
    const bidData = await redisService.getHighestBidData(auction.id);

    res.json({
      ...auction.toJSON(),
      currentHighestBid,
      highestBidder: bidData?.bidderName || null,
      timeRemaining: Math.max(0, endTime - now)
    });
  } catch (error) {
    console.error('❌ Error fetching auction:', error);
    res.status(500).json({ error: 'Failed to fetch auction' });
  }
});

// Get auction history/bids
router.get('/:id/bids', async (req, res) => {
  try {
    const auctionId = parseInt(req.params.id);
    if (isNaN(auctionId)) {
      return res.status(400).json({ error: 'Invalid auction ID' });
    }

    const bids = await Bid.findAll({
      where: { auctionId },
      order: [['bidTime', 'DESC']],
      limit: 20 // Get last 20 bids
    });

    res.json(bids);
  } catch (error) {
    console.error('❌ Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Manual end auction (for testing)
router.post('/:id/end', async (req, res) => {
  try {
    const auctionId = parseInt(req.params.id);
    if (isNaN(auctionId)) {
      return res.status(400).json({ error: 'Invalid auction ID' });
    }

    if (global.endAuction) {
      await global.endAuction(auctionId);
      res.json({ success: true, message: 'Auction ended manually' });
    } else {
      res.status(500).json({ error: 'End auction function not available' });
    }
  } catch (error) {
    console.error('❌ Error ending auction manually:', error);
    res.status(500).json({ error: 'Failed to end auction' });
  }
});

export default router;