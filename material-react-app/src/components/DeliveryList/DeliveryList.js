import React, { useState, useMemo, useEffect } from 'react';
import DeliveryCard from '../DeliveryCard/DeliveryCard';

const DeliveryList = ({ deliveries, searchTerm, onSearchChange, selectedDelivery, onSelectDelivery, alerts = [] }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 2; // 2 éléments par page comme demandé dans le screenshot

  // Recherche intelligente améliorée
  const filteredDeliveries = useMemo(() => {
    if (!searchTerm) return deliveries;

    const term = searchTerm.toLowerCase().trim();
    return deliveries.filter(delivery => {
      // Recherche dans tous les champs pertinents
      const searchableFields = [
        delivery.truck_id,
        delivery.id,
        delivery.driver?.name,
        delivery.pickup?.address,
        delivery.pickup?.city,
        delivery.destination,
        delivery.vehicle,
        delivery.cargo,
        delivery.cargo_type,
        delivery.state,
        delivery.driver?.company
      ].filter(Boolean).map(field => field.toString().toLowerCase());

      // Recherche par mots-clés multiples
      const searchWords = term.split(' ').filter(word => word.length > 0);

      return searchWords.every(word =>
        searchableFields.some(field => field.includes(word))
      );
    });
  }, [deliveries, searchTerm]);

  // Pagination intelligente
  const totalPages = Math.ceil(filteredDeliveries?.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDeliveries = filteredDeliveries?.slice(startIndex, endIndex);

  // Gestion des changements de page
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

  // Statistiques réelles de la flotte connectées aux vraies données
  const fleetStats = useMemo(() => {
    const total = deliveries.length;
    const enRoute = deliveries.filter(d => d.state === 'En Route').length;
    const arrived = deliveries.filter(d => d.state === 'At Destination').length;

    // Calculer vraies alertes depuis les APIs - toutes les alertes actives
    const totalAlerts = alerts.length; // Toutes les alertes réelles

    // Vitesse moyenne des camions en route
    const trucksInRoute = deliveries.filter(d => d.state === 'En Route');
    const avgSpeed = trucksInRoute.length > 0
      ? Math.round(trucksInRoute.reduce((sum, d) => sum + (d.speed || 0), 0) / trucksInRoute.length)
      : 0;

    return { total, enRoute, arrived, totalAlerts, avgSpeed };
  }, [deliveries, alerts]);

  const isMobile = window.innerWidth < 100 || window.innerHeight < 100;
  const isSmallMobile = window.innerWidth < 90 && window.innerHeight < 90;

  return (
    <div className="flex flex-col h-full" style={{
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden'
    }}>
      <div className={`${isSmallMobile ? 'p-1' : 'p-2'} border-b border-border flex-shrink-0`}>
      
<div className="relative mb-3 ml-12">
  <svg
    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"
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
    placeholder="Rechercher..."
    value={searchTerm}
    onChange={(e) => onSearchChange(e.target.value)}
    className="max-w-xs xxs:max-w-sm xs:max-w-md w-full h-8 xxs:h-10 xs:h-10 pl-8 xxs:pl-9 xs:pl-10 pr-3 xxs:pr-4 rounded-lg border border-input bg-background text-xs xxs:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-smooth"
    style={{ width: '100%', maxWidth: '220px' }}
  />
</div>

        {/* Statistiques optimisées - tailles réduites */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isSmallMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(50px, 1fr))',
          gap: isSmallMobile ? '2px' : '3px',
          marginBottom: isSmallMobile ? '4px' : '6px'
        }}>
          <div style={{
            background: '#10b981',
            borderRadius: isSmallMobile ? '4px' : '6px',
            padding: isSmallMobile ? '3px 2px' : '4px 3px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: isSmallMobile ? '10px' : '14px', fontWeight: 'bold', lineHeight: '1' }}>{fleetStats.total}</div>
            <div style={{ fontSize: isSmallMobile ? '6px' : '8px', marginTop: '1px' }}>Camions</div>
          </div>
          <div style={{
            background: '#3b82f6',
            borderRadius: '8px',
            padding: '6px 4px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '1' }}>{fleetStats.enRoute}</div>
            <div style={{ fontSize: '9px', marginTop: '1px' }}>En route</div>
          </div>
          <div style={{
            background: '#8b5cf6',
            borderRadius: '8px',
            padding: '6px 4px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '1' }}>{fleetStats.arrived}</div>
            <div style={{ fontSize: '9px', marginTop: '1px' }}>Arrivés</div>
          </div>
          <div style={{
            background: '#ef4444',
            borderRadius: '8px',
            padding: '6px 4px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '1' }}>{fleetStats.totalAlerts}</div>
            <div style={{ fontSize: '9px', marginTop: '1px' }}>Alertes</div>
          </div>
          <div style={{
            background: '#f59e0b',
            borderRadius: '8px',
            padding: '6px 4px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '1' }}>{fleetStats.avgSpeed}</div>
            <div style={{ fontSize: '9px', marginTop: '1px' }}>km/h</div>
          </div>
        </div>
      </div>

      <div className="p-2 border-b border-border flex-shrink-0 flex items-center justify-between">
        <div className="text-xs text-muted-foreground font-medium">Livraisons</div>
        {filteredDeliveries?.length > 0 && (
          <div className="text-xs xxs:text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(endIndex, filteredDeliveries?.length)}/{filteredDeliveries.length}
          </div>
        )}
      </div>

      <div className="flex-1 px-2 space-y-2" style={{
        height: 'calc(100vh - 280px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start'
      }}>
        {currentDeliveries?.length > 0 ? (
          currentDeliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              isSelected={selectedDelivery?.truck_id === delivery.truck_id}
              onSelect={() => onSelectDelivery && onSelectDelivery(delivery)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 xxs:h-40 xs:h-48 text-center">
            <div className="h-8 w-8 xxs:h-12 xxs:w-12 xs:h-16 xs:w-16 bg-muted rounded-full flex items-center justify-center mb-2 xxs:mb-3 xs:mb-4">
              <svg
                className="h-4 w-4 xxs:h-6 xxs:w-6 xs:h-8 xs:w-8 text-muted-foreground"
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
            <h3 className="text-xs xxs:text-sm xs:text-base font-medium text-foreground mb-1 xxs:mb-2">
              Aucune livraison
            </h3>
            <p className="text-xs xxs:text-sm text-muted-foreground">
              {searchTerm ? "Essayez d'autres termes" : 'Aucune livraison en cours'}
            </p>
          </div>
        )}
      </div>

      

      {/* Contrôles de pagination compacts SANS espace - Format exact screenshot */}
      {totalPages > 1 && (
        <div
          className="bg-background border-t border-border flex items-center justify-between"
          style={{
            margin: 0,
            padding: '8px 12px 8px 12px',
            height: '44px',
            borderBottom: 'none',
            position: 'sticky',
            bottom: 0,
            zIndex: 10
          }}
        >
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Préc
          </button>

          <div className="text-sm text-muted-foreground font-semibold">
            {currentPage + 1}/{totalPages}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium"
          >
            Suiv
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default DeliveryList;
