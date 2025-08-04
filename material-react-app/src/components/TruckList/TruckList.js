import React, { useState, useMemo, useEffect } from 'react';
import TruckCard from '../TruckCard/TruckCard';

const TruckList = ({ 
  trucks, 
  searchTerm, 
  onSearchChange, 
  onSelectTruck, 
  selectedTruck,
  alerts = []
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3; // Augmenté pour afficher plus de camions

  // Filtrage des camions en fonction du terme de recherche
  const filteredTrucks = useMemo(() => {
    if (!searchTerm) return trucks;

    const term = searchTerm.toLowerCase();
    return trucks.filter(truck =>
      truck.truck_id.toLowerCase().includes(term) ||
      truck.driver.name.toLowerCase().includes(term) ||
      truck.destination.toLowerCase().includes(term) ||
      truck.vehicle.toLowerCase().includes(term) ||
      truck.state.toLowerCase().includes(term)
    );
  }, [trucks, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredTrucks?.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrucks = filteredTrucks?.slice(startIndex, endIndex);

  // Gestion des changements de page
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  // Reset page à 0 quand la recherche change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  // Calculer les alertes par camion
  const getTruckAlerts = (truckId) => {
    return alerts.filter(alert => 
      alert.affectedRoutes && alert.affectedRoutes.includes(truckId)
    );
  };

  // Statistiques de la flotte
  const fleetStats = useMemo(() => {
    const total = trucks.length;
    const enRoute = trucks.filter(t => t.state === 'En Route').length;
    const atDestination = trucks.filter(t => t.state === 'At Destination').length;
    const totalAlerts = alerts.length;
    const avgSpeed = trucks.length > 0 
      ? Math.round(trucks.reduce((sum, t) => sum + (t.speed || 0), 0) / trucks.length)
      : 0;

    return { total, enRoute, atDestination, totalAlerts, avgSpeed };
  }, [trucks, alerts]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      {/* Header avec recherche */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '2px solid rgba(59, 130, 246, 0.1)',
        flexShrink: 0,
        background: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ position: 'relative', marginBottom: '16px', marginLeft: '10px' }}>
          <svg
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              width: '16px',
              height: '16px'
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un camion, conducteur, destination..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: '42px',
              paddingLeft: '44px',
              paddingRight: '16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '14px',
              color: '#374151',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.background = 'white';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.background = '#f8fafc';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Statistiques de la flotte */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{fleetStats.total}</div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>Camions</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{fleetStats.enRoute}</div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>En route</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{fleetStats.atDestination}</div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>Arrivés</div>
          </div>
          <div style={{
            background: fleetStats.totalAlerts > 0 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{fleetStats.totalAlerts}</div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>Alertes</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{fleetStats.avgSpeed}</div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>km/h moy</div>
          </div>
        </div>
      </div>

      {/* Titre avec compteur */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'white'
      }}>
        <div style={{ 
          fontSize: '14px', 
          color: '#4b5563', 
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
            <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1v-3c0-.6-.4-1-1-1h-5z"/>
            <circle cx="7" cy="18" r="2"/>
            <path d="M15 18H9"/>
            <circle cx="17" cy="18" r="2"/>
          </svg>
          Flotte Active
        </div>
        {filteredTrucks?.length > 0 && (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {startIndex + 1}-{Math.min(endIndex, filteredTrucks?.length)}/{filteredTrucks.length}
          </div>
        )}
      </div>

      {/* Liste des camions */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {currentTrucks?.length > 0 ? (
          currentTrucks.map((truck) => (
            <TruckCard 
              key={truck.truck_id} 
              truck={truck}
              alerts={getTruckAlerts(truck.truck_id)}
              isSelected={selectedTruck?.truck_id === truck.truck_id}
              onSelect={() => onSelectTruck(truck)}
            />
          ))
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            textAlign: 'center',
            background: 'white',
            borderRadius: '16px',
            border: '2px dashed #d1d5db',
            padding: '32px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: '#f3f4f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <svg
                style={{ width: '32px', height: '32px', color: '#9ca3af' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 8px 0'
            }}>
              Aucun camion trouvé
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              {searchTerm ? "Essayez d'autres termes de recherche" : 'Aucun camion en cours'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          position: 'sticky',
          top:142,
          bottom: 0,
          background: 'white',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: 'white',
              color: currentPage === 0 ? '#9ca3af' : '#374151',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 0) {
                e.target.style.background = '#f9fafb';
                e.target.style.borderColor = '#3b82f6';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>Page</span>
            <span style={{ 
              fontWeight: '700', 
              color: '#3b82f6',
              background: '#eff6ff',
              padding: '4px 8px',
              borderRadius: '6px'
            }}>
              {currentPage + 1}
            </span>
            <span>sur {totalPages}</span>
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: 'white',
              color: currentPage === totalPages - 1 ? '#9ca3af' : '#374151',
              cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages - 1) {
                e.target.style.background = '#f9fafb';
                e.target.style.borderColor = '#3b82f6';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default TruckList;
