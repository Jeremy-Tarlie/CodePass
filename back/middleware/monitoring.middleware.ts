import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import os from 'os';

// Interface pour les métriques système
interface SystemMetrics {
  timestamp: string;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    loadAverage: number[];
    usage: number;
  };
  uptime: number;
  requests: {
    total: number;
    perMinute: number;
    errors: number;
    averageResponseTime: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
  };
}

// Interface pour les alertes
interface Alert {
  id: string;
  type: 'PERFORMANCE' | 'ERROR' | 'SECURITY' | 'RESOURCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
  resolved: boolean;
}

class MonitoringService {
  private metrics: SystemMetrics;
  private alerts: Alert[] = [];
  private requestCounts: Map<string, number> = new Map();
  private responseTimes: number[] = [];
  private errorCount = 0;
  private startTime = Date.now();
  private slowQueries = 0;
  private totalQueries = 0;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  private initializeMetrics(): SystemMetrics {
    return {
      timestamp: new Date().toISOString(),
      memory: {
        used: 0,
        free: 0,
        total: 0,
        percentage: 0
      },
      cpu: {
        loadAverage: [0, 0, 0],
        usage: 0
      },
      uptime: 0,
      requests: {
        total: 0,
        perMinute: 0,
        errors: 0,
        averageResponseTime: 0
      },
      database: {
        connections: 0,
        queries: 0,
        slowQueries: 0
      }
    };
  }

  private startMonitoring(): void {
    // Mise à jour des métriques toutes les 30 secondes
    setInterval(() => {
      this.updateMetrics();
      this.checkAlerts();
    }, 30000);

    // Nettoyage des données anciennes toutes les 5 minutes
    setInterval(() => {
      this.cleanupOldData();
    }, 300000);
  }

  private updateMetrics(): void {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    this.metrics = {
      timestamp: new Date().toISOString(),
      memory: {
        used: memUsage.heapUsed,
        free: freeMem,
        total: totalMem,
        percentage: Math.round((memUsage.heapUsed / totalMem) * 100)
      },
      cpu: {
        loadAverage: os.loadavg(),
        usage: this.getCpuUsage()
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      requests: {
        total: this.requestCounts.get('total') || 0,
        perMinute: this.getRequestsPerMinute(),
        errors: this.errorCount,
        averageResponseTime: this.getAverageResponseTime()
      },
      database: {
        connections: 0, // À implémenter avec Prisma
        queries: this.totalQueries,
        slowQueries: this.slowQueries
      }
    };
  }

  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    return Math.round(100 - (100 * totalIdle / totalTick));
  }

  private getRequestsPerMinute(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    let count = 0;
    this.requestCounts.forEach((value, key) => {
      if (key !== 'total' && parseInt(key) > oneMinuteAgo) {
        count += value;
      }
    });
    
    return count;
  }

  private getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  private checkAlerts(): void {
    // Alerte mémoire élevée
    if (this.metrics.memory.percentage > 80) {
      this.addAlert('RESOURCE', 'HIGH', `Utilisation mémoire élevée: ${this.metrics.memory.percentage}%`);
    }

    // Alerte CPU élevé
    if (this.metrics.cpu.usage > 80) {
      this.addAlert('RESOURCE', 'HIGH', `Utilisation CPU élevée: ${this.metrics.cpu.usage}%`);
    }

    // Alerte taux d'erreur élevé
    const errorRate = this.metrics.requests.total > 0 
      ? (this.metrics.requests.errors / this.metrics.requests.total) * 100 
      : 0;
    
    if (errorRate > 10) {
      this.addAlert('ERROR', 'HIGH', `Taux d'erreur élevé: ${errorRate.toFixed(2)}%`);
    }

    // Alerte temps de réponse élevé
    if (this.metrics.requests.averageResponseTime > 2000) {
      this.addAlert('PERFORMANCE', 'MEDIUM', `Temps de réponse élevé: ${this.metrics.requests.averageResponseTime}ms`);
    }

    // Alerte requêtes lentes en base
    if (this.slowQueries > 10) {
      this.addAlert('PERFORMANCE', 'MEDIUM', `${this.slowQueries} requêtes lentes détectées`);
    }
  }

  private addAlert(type: Alert['type'], severity: Alert['severity'], message: string): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    // Éviter les doublons
    const existingAlert = this.alerts.find(a => 
      a.type === type && 
      a.message === message && 
      !a.resolved &&
      (Date.now() - new Date(a.timestamp).getTime()) < 300000 // 5 minutes
    );

    if (!existingAlert) {
      this.alerts.push(alert);
      console.warn(`🚨 ALERTE [${severity}] ${type}: ${message}`);
    }
  }

  private cleanupOldData(): void {
    // Nettoyer les anciens compteurs de requêtes
    const oneHourAgo = Date.now() - 3600000;
    this.requestCounts.forEach((_value, key) => {
      if (key !== 'total' && parseInt(key) < oneHourAgo) {
        this.requestCounts.delete(key);
      }
    });

    // Nettoyer les anciens temps de réponse
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500);
    }

    // Nettoyer les anciennes alertes résolues
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || (Date.now() - new Date(alert.timestamp).getTime()) < 86400000 // 24h
    );
  }

  public recordRequest(responseTime: number, isError: boolean = false): void {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000).toString();

    // Compter les requêtes
    this.requestCounts.set('total', (this.requestCounts.get('total') || 0) + 1);
    this.requestCounts.set(minuteKey, (this.requestCounts.get(minuteKey) || 0) + 1);

    // Enregistrer le temps de réponse
    this.responseTimes.push(responseTime);

    // Compter les erreurs
    if (isError) {
      this.errorCount++;
    }
  }

  public recordDatabaseQuery(isSlow: boolean = false): void {
    this.totalQueries++;
    if (isSlow) {
      this.slowQueries++;
    }
  }

  public getMetrics(): SystemMetrics {
    return this.metrics;
  }

  public getAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  public getHealthStatus(): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    const criticalAlerts = this.alerts.filter(a => 
      !a.resolved && a.severity === 'CRITICAL'
    ).length;
    
    const highAlerts = this.alerts.filter(a => 
      !a.resolved && a.severity === 'HIGH'
    ).length;

    if (criticalAlerts > 0) return 'CRITICAL';
    if (highAlerts > 2) return 'WARNING';
    return 'HEALTHY';
  }
}

// Instance globale du service de monitoring
const monitoringService = new MonitoringService();

/**
 * Middleware de monitoring des requêtes
 */
export const requestMonitor = (_req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  const originalSend = res.send;
  res.send = function(data) {
    // Vérifier si la réponse a déjà été envoyée pour éviter la récursion
    if (res.headersSent) {
      return this;
    }
    
    const responseTime = Date.now() - start;
    const isError = res.statusCode >= 400;
    
    monitoringService.recordRequest(responseTime, isError);
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware de monitoring de la base de données
 */
export const databaseMonitor = (_req: Request, _res: Response, next: NextFunction): void => {
  // Intercepter les requêtes Prisma
  const originalQuery = prisma.$queryRaw;
  (prisma as any).$queryRaw = function(...args: any[]) {
    const queryStart = Date.now();
    const result = (originalQuery as any).apply(this, args);
    
    if (result && typeof result.then === 'function') {
      return result.then((data: any) => {
        const queryTime = Date.now() - queryStart;
        const isSlow = queryTime > 1000; // Plus d'1 seconde
        
        monitoringService.recordDatabaseQuery(isSlow);
        
        return data;
      });
    }
    
    return result;
  };
  
  next();
};

/**
 * Middleware de monitoring des ressources système
 */
export const systemMonitor = (_req: Request, res: Response, next: NextFunction): Response | void => {
  // Vérifier l'utilisation mémoire
  const memUsage = process.memoryUsage();
  const memPercentage = (memUsage.heapUsed / os.totalmem()) * 100;
  
  // Si la mémoire est trop élevée, retourner une erreur
  if (memPercentage > 90) {
    return res.status(503).json({
      success: false,
      message: 'Serveur surchargé - utilisation mémoire trop élevée'
    });
  }
  
  next();
};

/**
 * Route pour obtenir les métriques
 */
export const getSystemMetrics = (_req: Request, res: Response): void => {
  const metrics = monitoringService.getMetrics();
  const alerts = monitoringService.getAlerts();
  const health = monitoringService.getHealthStatus();
  
  res.json({
    success: true,
    health,
    metrics,
    alerts,
    timestamp: new Date().toISOString()
  });
};

/**
 * Route pour obtenir le statut de santé
 */
export const getHealthStatus = (_req: Request, res: Response): void => {
  const health = monitoringService.getHealthStatus();
  const statusCode = health === 'CRITICAL' ? 503 : health === 'WARNING' ? 200 : 200;
  
  res.status(statusCode).json({
    success: health !== 'CRITICAL',
    status: health,
    timestamp: new Date().toISOString()
  });
};

/**
 * Route pour résoudre une alerte
 */
export const resolveAlert = (req: Request, res: Response): void => {
  const { alertId } = req.params;
  
  const resolved = monitoringService.resolveAlert(alertId as string);
  
  if (resolved) {
    res.json({
      success: true,
      message: 'Alerte résolue'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Alerte non trouvée'
    });
  }
};

// Export du service pour utilisation externe
export { monitoringService };
