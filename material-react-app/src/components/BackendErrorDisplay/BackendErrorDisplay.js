import React, { useState, useEffect } from 'react';
import environmentService from '../../services/environmentService';
import './BackendErrorDisplay.css';

const BackendErrorDisplay = ({ error, onRetry }) => {
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Analyser l'erreur pour générer un message utilisateur-friendly
  const errorInfo = React.useMemo(() => {
    if (!error) return null;

    // Catégoriser l'erreur
    if (error.includes('BACKEND_DOWN') || error.includes('ECONNREFUSED')) {
      return {
        icon: '🔌',
        title: 'Serveur Backend Non Démarré',
        message: 'Le serveur backend n\'est pas en cours d\'exécution',
        actions: [
          'Démarrez votre serveur Node.js/Express',
          'Vérifiez que le port 8080 est libre',
          'Consultez les logs du serveur'
        ],
        severity: 'critical',
        canRetry: true
      };
    }

    if (error.includes('NETWORK_ERROR') || error.includes('fetch')) {
      return {
        icon: '🌐',
        title: 'Erreur de Connectivité',
        message: 'Impossible de se connecter au serveur backend',
        actions: [
          'Vérifiez votre connexion internet',
          'Vérifiez l\'URL du backend: ' + environmentService.config.apiUrl,
          'Vérifiez que le serveur répond'
        ],
        severity: 'high',
        canRetry: true
      };
    }

    if (error.includes('TIMEOUT')) {
      return {
        icon: '⏱️',
        title: 'Serveur Lent',
        message: 'Le serveur met trop de temps à répondre',
        actions: [
          'Vérifiez la performance du serveur',
          'Vérifiez la charge du serveur MongoDB',
          'Augmentez le timeout si nécessaire'
        ],
        severity: 'medium',
        canRetry: true
      };
    }

    if (error.includes('ENDPOINT_404') || error.includes('ENDPOINT_NOT_FOUND')) {
      return {
        icon: '🔍',
        title: 'Configuration API Incorrecte',
        message: 'L\'endpoint requis n\'existe pas sur le serveur',
        actions: [
          'Vérifiez que /trip/details est configuré',
          'Vérifiez les routes Express.js',
          'Consultez la documentation MONGODB_INTEGRATION.md'
        ],
        severity: 'high',
        canRetry: false
      };
    }

    if (error.includes('SERVER_ERROR') || error.includes('500')) {
      return {
        icon: '💥',
        title: 'Erreur Serveur',
        message: 'Le serveur backend rencontre une erreur interne',
        actions: [
          'Vérifiez les logs du serveur backend',
          'Vérifiez la connexion MongoDB',
          'Vérifiez la configuration de la base de données'
        ],
        severity: 'critical',
        canRetry: true
      };
    }

    // Erreur générique
    return {
      icon: '❌',
      title: 'Erreur Backend',
      message: 'Problème avec le serveur backend',
      actions: [
        'Vérifiez que le serveur backend est démarré',
        'Consultez les logs pour plus de détails',
        'Vérifiez la configuration MongoDB'
      ],
      severity: 'medium',
      canRetry: true
    };
  }, [error]);

  // Exécuter un diagnostic détaillé
  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const diagnostic = await environmentService.runDiagnostic();
      setDiagnosticInfo(diagnostic);
    } catch (error) {
      console.error('Erreur diagnostic:', error);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  // Auto-diagnostic au montage
  useEffect(() => {
    const timer = setTimeout(() => {
      runDiagnostic();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!errorInfo) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      default: return '#6b7280';
    }
  };

  return (
    <div className="backend-error-display">
      <div className="error-container">
        {/* En-tête d'erreur */}
        <div className="error-header">
          <div className="error-icon" style={{ fontSize: '4rem' }}>
            {errorInfo.icon}
          </div>
          <h1 className="error-title">{errorInfo.title}</h1>
          <p className="error-message">{errorInfo.message}</p>
        </div>

        {/* Indicateur de sévérité */}
        <div 
          className="severity-indicator"
          style={{ 
            backgroundColor: getSeverityColor(errorInfo.severity),
            color: 'white' 
          }}
        >
          Sévérité: {errorInfo.severity.toUpperCase()}
        </div>

        {/* Actions recommandées */}
        <div className="actions-section">
          <h3>🔧 Actions recommandées :</h3>
          <ul className="actions-list">
            {errorInfo.actions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>

        {/* Boutons d'action */}
        <div className="buttons-section">
          {errorInfo.canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="retry-button"
              disabled={isRunningDiagnostic}
            >
              🔄 Réessayer la Connexion
            </button>
          )}
          
          <button
            onClick={runDiagnostic}
            className="diagnostic-button"
            disabled={isRunningDiagnostic}
          >
            {isRunningDiagnostic ? '⚙️ Diagnostic...' : '🔍 Diagnostic Complet'}
          </button>
          
          <a
            href={environmentService.config.apiUrl + '/api/health'}
            target="_blank"
            rel="noopener noreferrer"
            className="test-button"
          >
            🌐 Tester Backend
          </a>
        </div>

        {/* Détails techniques */}
        <div className="technical-section">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="toggle-technical"
          >
            {showTechnicalDetails ? '🔼' : '🔽'} Détails techniques
          </button>
          
          {showTechnicalDetails && (
            <div className="technical-details">
              <div className="config-info">
                <h4>Configuration :</h4>
                <ul>
                  <li><strong>Backend URL:</strong> {environmentService.config.apiUrl}</li>
                  <li><strong>Environnement:</strong> {process.env.NODE_ENV}</li>
                  <li><strong>Host:</strong> {window.location.hostname}</li>
                </ul>
              </div>
              
              {error && (
                <div className="error-details">
                  <h4>Erreur technique :</h4>
                  <code>{error}</code>
                </div>
              )}
              
              {diagnosticInfo && (
                <div className="diagnostic-details">
                  <h4>Diagnostic :</h4>
                  <pre>{JSON.stringify(diagnosticInfo, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Documentation */}
        <div className="documentation-section">
          <h3>📚 Documentation :</h3>
          <div className="doc-links">
            <span>• MONGODB_INTEGRATION.md - Guide d'intégration</span>
            <span>• SYSTÈME_100_DYNAMIQUE.md - Configuration complète</span>
            <span>• LOGISTICS_SYSTEM_README.md - Architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendErrorDisplay;
