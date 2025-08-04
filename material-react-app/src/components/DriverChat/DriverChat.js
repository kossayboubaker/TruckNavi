import React, { useState, useEffect, useRef } from 'react';
import './DriverChat.css';
import roleManager from '../../services/roleManager';

const DriverChat = ({ isOpen, onClose, currentUser, trucks = [] }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const messagesEndRef = useRef(null);

  // Simuler les conducteurs en ligne (exclure l'utilisateur actuel)
  useEffect(() => {
    const activeDrivers = trucks
      .filter(truck =>
        (truck.state === 'En Route' || truck.state === 'At Destination') &&
        truck.driver.id !== currentUser.id // Exclure l'utilisateur actuel
      )
      .map(truck => ({
        id: truck.driver.id,
        name: truck.driver.name,
        truckId: truck.truck_id,
        status: truck.state,
        lastSeen: new Date(),
        avatar: truck.driver.avatar || '👤'
      }));

    setOnlineDrivers(activeDrivers);
  }, [trucks, currentUser.id]);

  // Messages prédéfinis pour la démonstration
  useEffect(() => {
    if (selectedDriver) {
      const demoMessages = [
        {
          id: 1,
          senderId: selectedDriver.id,
          senderName: selectedDriver.name,
          content: `Salut ! Je suis en route vers ${trucks.find(t => t.driver.id === selectedDriver.id)?.destination || 'ma destination'}`,
          timestamp: new Date(Date.now() - 3600000),
          type: 'received'
        },
        {
          id: 2,
          senderId: 'current_user',
          senderName: 'Vous',
          content: 'Parfait, comment se passe le trajet ?',
          timestamp: new Date(Date.now() - 3000000),
          type: 'sent'
        },
        {
          id: 3,
          senderId: selectedDriver.id,
          senderName: selectedDriver.name,
          content: 'Tout va bien, petit embouteillage sur A1 mais ça avance. ETA toujours 15:30',
          timestamp: new Date(Date.now() - 1800000),
          type: 'received'
        }
      ];
      setMessages(demoMessages);
    }
  }, [selectedDriver, trucks]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedDriver) return;

    const message = {
      id: Date.now(),
      senderId: 'current_user',
      senderName: 'Vous',
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'sent'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simuler une réponse automatique après 2-3 secondes
    setTimeout(() => {
      const responses = [
        'Message reçu !',
        'D\'accord, merci pour l\'info',
        'Parfait, je vous tiens au courant',
        'Bien reçu, on reste en contact',
        'OK, pas de souci'
      ];
      
      const autoResponse = {
        id: Date.now() + 1,
        senderId: selectedDriver.id,
        senderName: selectedDriver.name,
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        type: 'received'
      };
      
      setMessages(prev => [...prev, autoResponse]);
    }, 2000 + Math.random() * 1000);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDriverStatus = (driver) => {
    const truck = trucks.find(t => t.driver.id === driver.id);
    if (!truck) return 'Hors ligne';
    
    switch (truck.state) {
      case 'En Route': return '🚛 En route';
      case 'At Destination': return '📍 Arrivé';
      case 'Maintenance': return '🔧 Maintenance';
      default: return '⏸️ En pause';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="driver-chat-overlay" onClick={onClose}>
      <div className="driver-chat-container" onClick={e => e.stopPropagation()}>
        {/* En-tête */}
        <div className="chat-header">
          <div className="chat-header-content">
            <div className="chat-icon">💬</div>
            <div>
              <h3>Chat Entre Conducteurs</h3>
              <p>{onlineDrivers.length} autre{onlineDrivers.length !== 1 ? 's' : ''} conducteur{onlineDrivers.length !== 1 ? 's' : ''} disponible{onlineDrivers.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button className="close-chat-btn" onClick={onClose}>✕</button>
        </div>

        <div className="chat-body">
          {/* Liste des conducteurs */}
          <div className="drivers-list">
            <div className="drivers-header">
              <h4>Conducteurs actifs</h4>
            </div>
            <div className="drivers-content">
              {onlineDrivers.length === 0 ? (
                <div className="no-drivers">
                  <div className="no-drivers-icon">😴</div>
                  <p>Aucun autre conducteur disponible</p>
                  <small style={{color: '#9ca3af', fontSize: '12px', marginTop: '8px', display: 'block'}}>Les autres conducteurs apparaîtront ici quand ils seront en ligne</small>
                </div>
              ) : (
                onlineDrivers.map(driver => (
                  <div
                    key={driver.id}
                    className={`driver-item ${selectedDriver?.id === driver.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <div className="driver-avatar">
                      {driver.avatar}
                      <div className="status-dot online"></div>
                    </div>
                    <div className="driver-info">
                      <div className="driver-name">{driver.name}</div>
                      <div className="driver-status">{getDriverStatus(driver)}</div>
                      <div className="driver-truck">Camion: {driver.truckId}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Zone de conversation */}
          <div className="chat-conversation">
            {!selectedDriver ? (
              <div className="no-conversation">
                <div className="no-conversation-icon">💬</div>
                <h4>Discussion entre conducteurs</h4>
                <p>Sélectionnez un collègue conducteur pour commencer une conversation</p>
                <small style={{color: '#6b7280', fontSize: '12px', marginTop: '8px'}}>Échangez sur les conditions de route, retards, ou coordinations</small>
              </div>
            ) : (
              <>
                {/* En-tête conversation */}
                <div className="conversation-header">
                  <div className="conversation-driver">
                    <div className="conversation-avatar">
                      {selectedDriver.avatar}
                      <div className="status-dot online"></div>
                    </div>
                    <div>
                      <div className="conversation-name">{selectedDriver.name}</div>
                      <div className="conversation-status">{getDriverStatus(selectedDriver)}</div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="messages-container">
                  {messages.map(message => (
                    <div key={message.id} className={`message ${message.type}`}>
                      <div className="message-content">
                        <div className="message-text">{message.content}</div>
                        <div className="message-time">{formatTime(message.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Zone de saisie */}
                <div className="message-input-container">
                  <div className="message-input-wrapper">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={`Message à ${selectedDriver.name}...`}
                      className="message-input"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="send-button"
                    >
                      📤
                    </button>
                  </div>
                  <div className="quick-messages">
                    {['👍 OK', '⚠️ Attention', '🚧 Problème route', '⏰ Retard'].map(quick => (
                      <button
                        key={quick}
                        onClick={() => setNewMessage(quick)}
                        className="quick-message-btn"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverChat;
