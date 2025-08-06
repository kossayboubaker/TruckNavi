import React, { useState, useEffect } from 'react';
import MDBox from '../MDBox';
import MDTypography from '../MDTypography';
import MDButton from '../MDButton';
import MDAlert from '../MDAlert';
import './MandatoryBreaksPanel.css';

const MandatoryBreaksPanel = ({ 
  selectedTruck, 
  mandatoryBreaks, 
  onStartBreak, 
  onEndBreak,
  onCheckRequirement 
}) => {
  const [breakRequirement, setBreakRequirement] = useState(null);
  const [activeBreak, setActiveBreak] = useState(null);

  // Récupérer les informations de pause pour le camion sélectionné
  const truckBreaks = selectedTruck ? mandatoryBreaks[selectedTruck.truck_id] : null;

  useEffect(() => {
    if (selectedTruck && onCheckRequirement) {
      // Vérifier les exigences de pause
      const requirement = onCheckRequirement(selectedTruck.truck_id);
      setBreakRequirement(requirement);
    }
  }, [selectedTruck, onCheckRequirement]);

  // Filtrer les pauses selon leur état
  const getBreaksByStatus = () => {
    if (!truckBreaks?.breaks) return { upcoming: [], active: [], completed: [] };

    return {
      upcoming: truckBreaks.breaks.filter(b => !b.isCompleted && !b.isActive),
      active: truckBreaks.breaks.filter(b => b.isActive),
      completed: truckBreaks.breaks.filter(b => b.isCompleted)
    };
  };

  const { upcoming, active, completed } = getBreaksByStatus();

  // Gérer le démarrage d'une pause
  const handleStartBreak = async (breakInfo) => {
    if (onStartBreak) {
      const result = await onStartBreak(selectedTruck.truck_id, breakInfo.id);
      if (result.success) {
        setActiveBreak(breakInfo);
      }
    }
  };

  // Gérer la fin d'une pause
  const handleEndBreak = async (breakInfo) => {
    if (onEndBreak) {
      const result = await onEndBreak(selectedTruck.truck_id, breakInfo.id);
      if (result.success) {
        setActiveBreak(null);
      }
    }
  };

  // Formater la durée en heures et minutes
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  };

  // Obtenir la couleur selon la priorité
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      default: return 'info';
    }
  };

  // Obtenir l'icône selon le type de pause
  const getBreakIcon = (breakType, priority) => {
    if (priority === 'critical') return '🛑';
    switch (breakType) {
      case 'mandatory': return '⏸️';
      case 'extended': return '⏰';
      case 'daily_rest': return '🏠';
      case 'weekly_rest': return '🛌';
      default: return '⏸️';
    }
  };

  if (!selectedTruck) {
    return (
      <MDBox p={3} textAlign="center">
        <MDTypography variant="h6" color="text">
          Sélectionnez un camion pour voir les pauses obligatoires
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <MDBox className="mandatory-breaks-panel">
      {/* Header avec informations du chauffeur */}
      <MDBox mb={2}>
        <MDTypography variant="h5" fontWeight="medium">
          Pauses Obligatoires
        </MDTypography>
        <MDTypography variant="body2" color="text">
          Camion: {selectedTruck.truck_id} | Chauffeur: {selectedTruck.driver?.name || 'N/A'}
        </MDTypography>
      </MDBox>

      {/* Alertes de requirement immédiat */}
      {breakRequirement?.required && (
        <MDBox mb={2}>
          <MDAlert color="error" dismissible={false}>
            <MDTypography variant="body2">
              <strong>⚠️ Pause immédiate requise !</strong><br />
              Temps de conduite: {formatDuration(breakRequirement.currentDrivingTime)}
              {breakRequirement.timeRemaining === 0 && ' (LIMITE DÉPASSÉE)'}
            </MDTypography>
          </MDAlert>
        </MDBox>
      )}

      {/* Warnings généraux */}
      {truckBreaks?.warnings && truckBreaks.warnings.length > 0 && (
        <MDBox mb={2}>
          {truckBreaks.warnings.map((warning, index) => (
            <MDAlert key={index} color={warning.severity === 'danger' ? 'error' : 'warning'} mb={1}>
              <MDTypography variant="body2">
                {warning.message}
              </MDTypography>
            </MDAlert>
          ))}
        </MDBox>
      )}

      {/* Pause active */}
      {active.length > 0 && (
        <MDBox mb={3} className="active-break-section">
          <MDTypography variant="h6" color="warning" mb={1}>
            🚦 Pause en cours
          </MDTypography>
          {active.map((breakInfo) => (
            <MDBox key={breakInfo.id} className="break-card active-break" p={2} mb={1}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center">
                <MDBox>
                  <MDTypography variant="button" fontWeight="medium">
                    {getBreakIcon(breakInfo.type, breakInfo.priority)} {breakInfo.reason}
                  </MDTypography>
                  <MDTypography variant="caption" display="block" color="text">
                    Durée minimum: {breakInfo.duration} minutes
                  </MDTypography>
                  <MDTypography variant="caption" display="block" color="text">
                    {breakInfo.regulation}
                  </MDTypography>
                </MDBox>
                <MDButton
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleEndBreak(breakInfo)}
                >
                  Terminer
                </MDButton>
              </MDBox>
            </MDBox>
          ))}
        </MDBox>
      )}

      {/* Prochaines pauses */}
      {upcoming.length > 0 && (
        <MDBox mb={3}>
          <MDTypography variant="h6" color="dark" mb={1}>
            📅 Pauses programmées
          </MDTypography>
          {upcoming.map((breakInfo) => (
            <MDBox key={breakInfo.id} className="break-card upcoming-break" p={2} mb={1}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center">
                <MDBox flex={1}>
                  <MDTypography variant="button" fontWeight="medium">
                    {getBreakIcon(breakInfo.type, breakInfo.priority)} {breakInfo.reason}
                  </MDTypography>
                  <MDTypography variant="caption" display="block" color="text">
                    Position: {Math.round(breakInfo.position)}% du trajet
                  </MDTypography>
                  <MDTypography variant="caption" display="block" color="text">
                    Durée: {breakInfo.duration} min | Programmée: {new Date(breakInfo.scheduledTime).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                  </MDTypography>
                  <MDTypography variant="caption" display="block" color="text">
                    {breakInfo.regulation}
                  </MDTypography>
                </MDBox>
                <MDBox>
                  {breakInfo.priority === 'critical' && (
                    <MDButton
                      variant="contained"
                      color={getPriorityColor(breakInfo.priority)}
                      size="small"
                      onClick={() => handleStartBreak(breakInfo)}
                      sx={{ mr: 1 }}
                    >
                      PAUSE IMMÉDIATE
                    </MDButton>
                  )}
                  {breakInfo.priority !== 'critical' && (
                    <MDButton
                      variant="outlined"
                      color={getPriorityColor(breakInfo.priority)}
                      size="small"
                      onClick={() => handleStartBreak(breakInfo)}
                    >
                      Démarrer
                    </MDButton>
                  )}
                </MDBox>
              </MDBox>
            </MDBox>
          ))}
        </MDBox>
      )}

      {/* Pauses terminées */}
      {completed.length > 0 && (
        <MDBox>
          <MDTypography variant="h6" color="success" mb={1}>
            ✅ Pauses terminées ({completed.length})
          </MDTypography>
          {completed.slice(0, 3).map((breakInfo) => (
            <MDBox key={breakInfo.id} className="break-card completed-break" p={2} mb={1}>
              <MDTypography variant="button" fontWeight="medium" color="success">
                ✅ {breakInfo.reason}
              </MDTypography>
              <MDTypography variant="caption" display="block" color="text">
                Durée effective: {breakInfo.actualDuration || breakInfo.duration} min
              </MDTypography>
              {breakInfo.actualEndTime && (
                <MDTypography variant="caption" display="block" color="text">
                  Terminée: {new Date(breakInfo.actualEndTime).toLocaleTimeString('fr-FR')}
                </MDTypography>
              )}
            </MDBox>
          ))}
          {completed.length > 3 && (
            <MDTypography variant="caption" color="text" textAlign="center" display="block">
              ... et {completed.length - 3} autres pauses terminées
            </MDTypography>
          )}
        </MDBox>
      )}

      {/* Aucune pause programmée */}
      {(!truckBreaks || truckBreaks.breaks?.length === 0) && !breakRequirement?.required && (
        <MDBox textAlign="center" py={3}>
          <MDTypography variant="h6" color="success">
            ✅ Aucune pause obligatoire
          </MDTypography>
          <MDTypography variant="body2" color="text">
            Ce trajet ne nécessite pas de pause réglementaire
          </MDTypography>
        </MDBox>
      )}

      {/* Statistiques du chauffeur */}
      {breakRequirement?.statistics && (
        <MDBox mt={3} p={2} className="driver-statistics">
          <MDTypography variant="h6" mb={1}>
            📊 Statistiques chauffeur
          </MDTypography>
          <MDBox display="flex" flexWrap="wrap" gap={2}>
            <MDBox>
              <MDTypography variant="caption" color="text">Temps conduite/jour</MDTypography>
              <MDTypography variant="button" display="block">
                {formatDuration(breakRequirement.statistics.dailyDrivingTime)}
              </MDTypography>
            </MDBox>
            <MDBox>
              <MDTypography variant="caption" color="text">Depuis dernière pause</MDTypography>
              <MDTypography variant="button" display="block">
                {formatDuration(breakRequirement.statistics.timeSinceLastBreak)}
              </MDTypography>
            </MDBox>
            <MDBox>
              <MDTypography variant="caption" color="text">État</MDTypography>
              <MDTypography variant="button" display="block" color={breakRequirement.statistics.isOnBreak ? 'warning' : 'success'}>
                {breakRequirement.statistics.isOnBreak ? '⏸️ En pause' : '🚗 En conduite'}
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      )}
    </MDBox>
  );
};

export default MandatoryBreaksPanel;
