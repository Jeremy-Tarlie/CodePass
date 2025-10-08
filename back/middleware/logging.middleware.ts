import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Interface pour les logs
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  userId?: string;
  message: string;
  error?: any;
}

// Interface pour les métriques
interface Metrics {
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
  uniqueUsers: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
}

export class LoggingService {
  private logDir: string;
  private metrics: Map<string, any> = new Map();

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.initializeMetrics();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private initializeMetrics(): void {
    this.metrics.set('totalRequests', 0);
    this.metrics.set('errorCount', 0);
    this.metrics.set('responseTimes', []);
    this.metrics.set('uniqueUsers', new Set());
    this.metrics.set('endpointCounts', new Map());
  }

  /**
   * Écrit un log dans un fichier
   */
  public writeLogFile(logEntry: LogEntry): void {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `app-${date}.log`);
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('Erreur lors de l\'écriture du log:', err);
      }
    });
  }

  /**
   * Met à jour les métriques
   */
  public updateMetrics(logEntry: LogEntry): void {
    // Total des requêtes
    this.metrics.set('totalRequests', this.metrics.get('totalRequests') + 1);
    
    // Compteur d'erreurs
    if (logEntry.statusCode >= 400) {
      this.metrics.set('errorCount', this.metrics.get('errorCount') + 1);
    }
    
    // Temps de réponse
    const responseTimes = this.metrics.get('responseTimes');
    responseTimes.push(logEntry.responseTime);
    
    // Garder seulement les 1000 derniers temps de réponse
    if (responseTimes.length > 1000) {
      responseTimes.shift();
    }
    
    // Utilisateurs uniques
    if (logEntry.userId) {
      const uniqueUsers = this.metrics.get('uniqueUsers');
      uniqueUsers.add(logEntry.userId);
    }
    
    // Comptage des endpoints
    const endpointCounts = this.metrics.get('endpointCounts');
    const endpoint = `${logEntry.method} ${logEntry.url}`;
    endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + 1);
  }

  /**
   * Génère un rapport de métriques
   */
  public getMetrics(): Metrics {
    const totalRequests = this.metrics.get('totalRequests');
    const errorCount = this.metrics.get('errorCount');
    const responseTimes = this.metrics.get('responseTimes');
    const uniqueUsers = this.metrics.get('uniqueUsers');
    const endpointCounts = this.metrics.get('endpointCounts');
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
      : 0;
    
    const topEndpoints = Array.from(endpointCounts.entries())
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]: any) => ({ endpoint, count }));
    
    return {
      totalRequests,
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      uniqueUsers: uniqueUsers.size,
      topEndpoints
    };
  }

  /**
   * Nettoie les anciens fichiers de logs
   */
  public cleanupOldLogs(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    fs.readdir(this.logDir, (err, files) => {
      if (err) return;
      
      files.forEach(file => {
        if (file.startsWith('app-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Erreur lors de la suppression de ${file}:`, err);
              } else {
                console.log(`Fichier de log supprimé: ${file}`);
              }
            });
          }
        }
      });
    });
  }
}

// Instance globale du service de logging
const loggingService = new LoggingService();

/**
 * Middleware de logging des requêtes
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const userId = (req as any).user?.id;

  // Intercepter la réponse
  const originalSend = res.send;
  res.send = function(data) {
    // Vérifier si la réponse a déjà été envoyée pour éviter la récursion
    if (res.headersSent) {
      return this;
    }
    
    const responseTime = Date.now() - start;
    
    // Déterminer le niveau de log
    let level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' = 'INFO';
    if (res.statusCode >= 500) {
      level = 'ERROR';
    } else if (res.statusCode >= 400) {
      level = 'WARN';
    } else if (process.env.NODE_ENV === 'development') {
      level = 'DEBUG';
    }
    
    // Créer l'entrée de log
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      ip,
      userAgent,
      userId,
      message: `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`
    };
    
    // Écrire le log
    loggingService.writeLogFile(logEntry);
    loggingService.updateMetrics(logEntry);
    
    // Log en console pour le développement
    if (process.env.NODE_ENV === 'development') {
      const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Rouge ou vert
      console.log(`${color}${logEntry.message}\x1b[0m`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware de logging des erreurs
 */
export const errorLogger = (err: any, req: Request, _res: Response, next: NextFunction): void => {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    method: req.method,
    url: req.originalUrl,
    statusCode: err.status || 500,
    responseTime: 0,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    userId: (req as any).user?.id,
    message: err.message || 'Erreur inconnue',
    error: {
      name: err.name,
      stack: err.stack,
      ...err
    }
  };
  
  loggingService.writeLogFile(logEntry);
  
  // Log en console
  console.error('Erreur:', err);
  
  next(err);
};

/**
 * Middleware de logging des événements de sécurité
 */
export const securityLogger = async (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Vérifier si la réponse a déjà été envoyée pour éviter la récursion
    if (res.headersSent) {
      return this;
    }
    
    // Log des événements de sécurité
    if (req.path.includes('/auth') || res.statusCode >= 400) {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: res.statusCode >= 400 ? 'WARN' : 'INFO',
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: 0,
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        userId: (req as any).user?.id,
        message: `Événement de sécurité: ${req.method} ${req.originalUrl} - ${res.statusCode}`
      };
      
      // Écrire dans un fichier de log de sécurité séparé
      const date = new Date().toISOString().split('T')[0];
      const securityLogFile = path.join(loggingService['logDir'], `security-${date}.log`);
      const logLine = JSON.stringify(logEntry) + '\n';
      
      fs.appendFile(securityLogFile, logLine, (err) => {
        if (err) {
          console.error('Erreur lors de l\'écriture du log de sécurité:', err);
        }
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware de monitoring des performances
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const startMemory = process.memoryUsage();
  
  const originalSend = res.send;
  res.send = function(data) {
    // Vérifier si la réponse a déjà été envoyée pour éviter la récursion
    if (res.headersSent) {
      return this;
    }
    
    const responseTime = Date.now() - start;
    const endMemory = process.memoryUsage();
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    // Alerter si la réponse est trop lente
    if (responseTime > 5000) { // 5 secondes
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'WARN',
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        userId: (req as any).user?.id,
        message: `Requête lente détectée: ${responseTime}ms, mémoire: ${memoryDelta} bytes`
      };
      
      loggingService.writeLogFile(logEntry);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Route pour obtenir les métriques
 */
export const getMetrics = (_req: Request, res: Response): void => {
  const metrics = loggingService.getMetrics();
  res.json({
    success: true,
    metrics,
    timestamp: new Date().toISOString()
  });
};

/**
 * Nettoyage automatique des logs (à appeler périodiquement)
 */
export const cleanupLogs = () => {
  loggingService.cleanupOldLogs(30); // Garder 30 jours
};

// Export du service pour utilisation externe
export { loggingService };
