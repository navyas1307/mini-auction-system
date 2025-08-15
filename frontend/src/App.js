import React, { useState } from 'react';
import CreateAuction from './components/CreateAuction';
import ParticipateAuction from './components/ParticipateAuction';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('home');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
        return <CreateAuction onBack={() => setCurrentView('home')} />;
      case 'participate':
        return <ParticipateAuction onBack={() => setCurrentView('home')} />;
      default:
        return (
          <div className="home-container">
            <h1>Mini Auction System</h1>
            <p>Welcome to our real-time auction platform!</p>
            <div className="button-container">
              <button 
                className="main-button create-btn"
                onClick={() => setCurrentView('create')}
              >
                Create Auction
              </button>
              <button 
                className="main-button participate-btn"
                onClick={() => setCurrentView('participate')}
              >
                Participate in Auction
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      {renderCurrentView()}
    </div>
  );
}

export default App;