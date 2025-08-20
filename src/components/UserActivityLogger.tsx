import React, { useEffect } from 'react';
import { API_USER_LOGS } from '../lib/apiBase';

interface LogData {
  userId?: string;
  username?: string;
  action: string;
  resource?: string;
  details?: any;
  userAgent?: string;
}

class UserActivityLogger {
  private static instance: UserActivityLogger;
  private baseUrl = API_USER_LOGS;

  private constructor() {}

  public static getInstance(): UserActivityLogger {
    if (!UserActivityLogger.instance) {
      UserActivityLogger.instance = new UserActivityLogger();
    }
    return UserActivityLogger.instance;
  }

  public async logActivity(logData: LogData): Promise<void> {
    try {
      // 自动注入当前登录用户信息（若未显式传入）
      let enriched: LogData = { ...logData };
      try {
        const raw = localStorage.getItem('currentUser');
        const currentUser = raw ? JSON.parse(raw) : null;
        if (currentUser) {
          if (!enriched.userId && currentUser.id) enriched.userId = String(currentUser.id);
          if (!enriched.username && (currentUser.username || currentUser.name)) {
            enriched.username = String(currentUser.username || currentUser.name);
          }
        }
      } catch {}
  
      const payload = {
        ...enriched,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ip: '', // 将由后端自动获取
      };
  
      await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('记录用户活动失败:', error);
    }
  }

  // 便捷方法
  public logFileUpload(filename: string, userId?: string): void {
    this.logActivity({
      userId,
      action: 'file_upload',
      resource: filename,
      details: { filename }
    });
  }

  public logFileDownload(filename: string, userId?: string): void {
    this.logActivity({
      userId,
      action: 'file_download',
      resource: filename,
      details: { filename }
    });
  }

  public logFileDelete(filename: string, userId?: string): void {
    this.logActivity({
      userId,
      action: 'file_delete',
      resource: filename,
      details: { filename }
    });
  }

  public logFileView(filename: string, userId?: string): void {
    this.logActivity({
      userId,
      action: 'file_view',
      resource: filename,
      details: { filename }
    });
  }

  public logFolderCreate(folderName: string, userId?: string): void {
    this.logActivity({
      userId,
      action: 'folder_create',
      resource: folderName,
      details: { folderName }
    });
  }

  public logFolderDelete(folderName: string, userId?: string): void {
    this.logActivity({
      userId,
      action: 'folder_delete',
      resource: folderName,
      details: { folderName }
    });
  }

  public logLogin(username: string): void {
    this.logActivity({
      username,
      action: 'user_login',
      details: { username }
    });
  }

  public logLogout(username: string): void {
    this.logActivity({
      username,
      action: 'user_logout',
      details: { username }
    });
  }

  public logSearch(query: string, userId?: string): void {
    this.logActivity({
      userId,
      action: 'search',
      resource: query,
      details: { query }
    });
  }

  public logSettingsChange(setting: string, value: any, userId?: string): void {
    this.logActivity({
      userId,
      action: 'settings_change',
      resource: setting,
      details: { setting, value }
    });
  }
}

// React Hook for easy usage
export const useUserActivityLogger = () => {
  const logger = UserActivityLogger.getInstance();

  useEffect(() => {
    // 记录页面访问
    logger.logActivity({
      action: 'page_visit',
      resource: window.location.pathname,
      details: { 
        pathname: window.location.pathname,
        search: window.location.search
      }
    });
  }, []);

  return logger;
};

// HOC for automatic activity logging
export const withActivityLogging = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return (props: P) => {
    useUserActivityLogger();
    return <WrappedComponent {...props} />;
  };
};

export default UserActivityLogger;