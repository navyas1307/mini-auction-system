import Redis from 'ioredis';

const redis = new Redis(process.env.UPSTASH_REDIS_URL);

export const setHighestBid = async (auctionId, amount, bidderEmail, bidderName) => {
  const key = `auction:${auctionId}:highest_bid`;
  const bidData = {
    amount: parseFloat(amount), // Ensure it's stored as a number
    bidderEmail: bidderEmail,
    bidderName: bidderName,
    timestamp: new Date().toISOString()
  };
  
  await redis.set(key, JSON.stringify(bidData));
  return bidData;
};

export const getCurrentHighestBid = async (auctionId) => {
  const key = `auction:${auctionId}:highest_bid`;
  const data = await redis.get(key);
  
  if (data) {
    const bidData = JSON.parse(data);
    return parseFloat(bidData.amount); // Always return as number
  }
  
  return 0; // Return 0 as number, not string
};

export const getHighestBidData = async (auctionId) => {
  const key = `auction:${auctionId}:highest_bid`;
  const data = await redis.get(key);
  
  if (data) {
    const bidData = JSON.parse(data);
    // Ensure amount is always a number when returned
    return {
      ...bidData,
      amount: parseFloat(bidData.amount)
    };
  }
  
  return null;
};