import React, { useState } from 'react';
import CreateAuction from './components/CreateAuction';
import ParticipateAuction from './components/ParticipateAuction';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('home');

  const renderNavigation = () => (
    <nav className="nav-header">
      <div className="nav-container">
        <a href="#" className="logo" onClick={() => setCurrentView('home')}>
          <div className="logo-icon">A</div>
          AuctionHub Pro
        </a>
        {currentView !== 'home' && (
          <button 
            className="btn btn-secondary"
            onClick={() => setCurrentView('home')}
          >
            Back to Home
          </button>
        )}
      </div>
    </nav>
  );

  const renderFeatures = () => (
    <div className="features-section">
      <div className="feature-card">
        <div className="feature-icon">RT</div>
        <h3 className="feature-title">Real-Time Bidding Technology</h3>
        <p className="feature-description">
          Experience lightning-fast bid updates with our advanced WebSocket infrastructure. 
          Every bid is processed and broadcast instantly to all participants.
        </p>
      </div>
      <div className="feature-card">
        <div className="feature-icon">SEC</div>
        <h3 className="feature-title">Enterprise Security</h3>
        <p className="feature-description">
          Bank-level encryption and multi-layer security protocols protect your transactions. 
          All auction data is encrypted and stored securely.
        </p>
      </div>
      <div className="feature-card">
        <div className="feature-icon">24/7</div>
        <h3 className="feature-title">Global Marketplace</h3>
        <p className="feature-description">
          Connect with buyers and sellers worldwide. Our platform operates 24/7 
          with automated notifications and seamless payment processing.
        </p>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
        return <CreateAuction onBack={() => setCurrentView('home')} />;
      case 'participate':
        return <ParticipateAuction onBack={() => setCurrentView('home')} />;
      default:
        return (
          <div className="home-container">
            <div className="hero-section">
              <h1 className="hero-title">
                The Premier <span className="gradient-text">Auction Platform</span>
              </h1>
              <p className="hero-subtitle">
                Join thousands of buyers and sellers in our secure, real-time marketplace. 
                Create auctions, place bids, and complete transactions with confidence.
              </p>
              <div className="cta-buttons">
                <button 
                  className="cta-button cta-primary"
                  onClick={() => setCurrentView('create')}
                >
                  Start Selling
                </button>
                <button 
                  className="cta-button cta-secondary"
                  onClick={() => setCurrentView('participate')}
                >
                  Browse Auctions
                </button>
              </div>
            </div>

            {renderFeatures()}

           
            
          </div>
        );
    }
  };

  return (
    <div className="App">
      {renderNavigation()}
      {renderCurrentView()}
    </div>
  );
}

export default App;
