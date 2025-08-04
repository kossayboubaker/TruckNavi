// Système de gestion des rôles utilisateur
class RoleManager {
  constructor() {
    // Rôles disponibles
    this.roles = {
      CONDUCTEUR: 'conducteur',
      ADMIN: 'admin', 
      SUPERADMIN: 'superadmin'
    };
    
    // Rôle par défaut
    this.currentRole = this.roles.SUPERADMIN;
    this.currentUserId = 'user_001';
    this.currentTruckId = 'TN-001'; // Pour les conducteurs
    
    // Permissions par rôle
    this.permissions = {
      [this.roles.CONDUCTEUR]: {
        canViewAllTrucks: false,
        canViewOwnTruck: true,
        canViewStatistics: false,
        canViewAllAlerts: false,
        canViewOwnAlerts: true,
        canManageSettings: false,
        canChat: true,
        description: 'Accès limité à son propre véhicule et alertes'
      },
      [this.roles.ADMIN]: {
        canViewAllTrucks: true,
        canViewOwnTruck: true,
        canViewStatistics: false, // Pas de statistiques selon demande
        canViewAllAlerts: true,
        canViewOwnAlerts: true,
        canManageSettings: true,
        canChat: true,
        description: 'Vue simplifiée avec carte et liste des camions sans statistiques'
      },
      [this.roles.SUPERADMIN]: {
        canViewAllTrucks: true,
        canViewOwnTruck: true,
        canViewStatistics: true,
        canViewAllAlerts: true,
        canViewOwnAlerts: true,
        canManageSettings: true,
        canChat: true,
        description: 'Accès complet à toutes les fonctionnalités'
      }
    };
    
    // Exposer dans window pour tests console
    this.exposeToConsole();
  }
  
  // Changer de rôle
  setRole(role, userId = null, truckId = null) {
    if (!Object.values(this.roles).includes(role)) {
      console.error(`❌ Rôle invalide: ${role}. Rôles disponibles:`, Object.values(this.roles));
      return false;
    }
    
    this.currentRole = role;
    if (userId) this.currentUserId = userId;
    if (truckId) this.currentTruckId = truckId;
    
    console.log(`✅ Rôle changé: ${role.toUpperCase()}`);
    console.log(`👤 Utilisateur: ${this.currentUserId}`);
    if (role === this.roles.CONDUCTEUR) {
      console.log(`🚛 Camion assigné: ${this.currentTruckId}`);
    }
    console.log(`🔑 Permissions:`, this.permissions[role]);
    
    // Déclencher un événement pour mettre à jour l'interface
    window.dispatchEvent(new CustomEvent('roleChanged', { 
      detail: { 
        role: this.currentRole,
        userId: this.currentUserId,
        truckId: this.currentTruckId,
        permissions: this.getCurrentPermissions()
      }
    }));
    
    return true;
  }
  
  // Obtenir le rôle actuel
  getCurrentRole() {
    return this.currentRole;
  }
  
  // Obtenir les permissions actuelles
  getCurrentPermissions() {
    return this.permissions[this.currentRole];
  }
  
  // Vérifier une permission spécifique
  hasPermission(permission) {
    return this.permissions[this.currentRole]?.[permission] || false;
  }
  
  // Filtrer les camions selon le rôle
  filterTrucks(trucks) {
    if (this.currentRole === this.roles.CONDUCTEUR) {
      return trucks.filter(truck => truck.truck_id === this.currentTruckId);
    }
    return trucks; // Admin et Superadmin voient tous les camions
  }
  
  // Filtrer les alertes selon le rôle
  filterAlerts(alerts, trucks) {
    if (this.currentRole === this.roles.CONDUCTEUR) {
      // Ne montrer que les alertes qui affectent son camion
      return alerts.filter(alert => 
        alert.affectedRoutes && 
        alert.affectedRoutes.includes(this.currentTruckId)
      );
    }
    return alerts; // Admin et Superadmin voient toutes les alertes
  }
  
  // Obtenir les statistiques selon le rôle
  getVisibleStats(stats) {
    if (this.currentRole === this.roles.ADMIN) {
      // Admin: pas de statistiques détaillées
      return {
        ...stats,
        totalAlerts: 0, // Masquer le compteur d'alertes
        avgSpeed: 0 // Masquer la vitesse moyenne
      };
    }
    
    if (this.currentRole === this.roles.CONDUCTEUR) {
      // Conducteur: stats limitées à son camion
      const myTrucks = this.filterTrucks([]);
      return {
        total: myTrucks.length,
        enRoute: myTrucks.filter(t => t.state === 'En Route').length,
        arrived: myTrucks.filter(t => t.state === 'At Destination').length,
        totalAlerts: 0, // Les alertes sont gérées séparément
        avgSpeed: myTrucks[0]?.speed || 0
      };
    }
    
    return stats; // Superadmin: toutes les stats
  }
  
  // Exposer les fonctions de test dans la console
  exposeToConsole() {
    // Fonctions globales pour tester dans la console
    window.roleManager = this;
    
    window.setRole = (role, userId, truckId) => {
      return this.setRole(role, userId, truckId);
    };
    
    window.testConducteur = (truckId = 'TN-001') => {
      return this.setRole(this.roles.CONDUCTEUR, 'conducteur_001', truckId);
    };
    
    window.testAdmin = () => {
      return this.setRole(this.roles.ADMIN, 'admin_001');
    };
    
    window.testSuperAdmin = () => {
      return this.setRole(this.roles.SUPERADMIN, 'superadmin_001');
    };
    
    window.showCurrentRole = () => {
      console.log(`📋 Rôle actuel: ${this.currentRole.toUpperCase()}`);
      console.log(`👤 Utilisateur: ${this.currentUserId}`);
      console.log(`🔑 Permissions:`, this.getCurrentPermissions());
      if (this.currentRole === this.roles.CONDUCTEUR) {
        console.log(`🚛 Camion assigné: ${this.currentTruckId}`);
      }
    };
    
    window.showAvailableRoles = () => {
      console.log('🎭 Rôles disponibles:');
      Object.entries(this.permissions).forEach(([role, perms]) => {
        console.log(`\n${role.toUpperCase()}: ${perms.description}`);
        console.log('Permissions:', perms);
      });
      console.log('\n📝 Commandes console:');
      console.log('testConducteur("TN-001") - Teste le rôle conducteur');
      console.log('testAdmin() - Teste le rôle admin');
      console.log('testSuperAdmin() - Teste le rôle superadmin');
      console.log('showCurrentRole() - Affiche le rôle actuel');
    };
    
    // Message d'aide dans la console
    console.log('🎭 Système de rôles activé!');
    console.log('Tapez showAvailableRoles() pour voir les commandes disponibles');
  }
}

const roleManager = new RoleManager();
export default roleManager;
