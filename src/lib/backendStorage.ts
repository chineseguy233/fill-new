import { API_FILES, API_ORIGIN } from './apiBase';

// 后端存储服务
class BackendStorageService {
  private baseUrl = API_FILES;

  // 检查后端服务是否可用
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_ORIGIN}/health`);
      return response.ok;
    } catch (error) {
      console.warn('后端服务不可用:', error);
      return false;
    }
  }

  // 上传文件到后端
  async uploadFiles(files: File[], metadata?: {
    title?: string;
    description?: string;
    tags?: string;
    folderId?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const formData = new FormData();
      
      // 添加文件
      files.forEach(file => {
        formData.append('files', file);
      });

      // 添加元数据
      if (metadata?.title) formData.append('title', metadata.title);
      if (metadata?.description) formData.append('description', metadata.description);
      if (metadata?.tags) formData.append('tags', metadata.tags);
      if (metadata?.folderId) formData.append('folderId', metadata.folderId);

      // 注入当前用户信息：仅将 ID 放在请求头，姓名放入表单字段避免非 ASCII 头部错误
      const headers: Record<string, string> = {};
      try {
        const raw = localStorage.getItem('currentUser');
        const currentUser = raw ? JSON.parse(raw) : {};
        if (currentUser?.id) {
          headers['X-User-Id'] = String(currentUser.id);
          formData.append('userId', String(currentUser.id));
        }
        if (currentUser?.username || currentUser?.name) {
          // 姓名改为表单字段，避免浏览器因中文 Header 报错
          formData.append('userName', String(currentUser.username || currentUser.name));
        }
      } catch {}

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message,
          data: result.data
        };
      } else {
        return {
          success: false,
          message: result.message || '上传失败'
        };
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      return {
        success: false,
        message: '网络错误，无法连接到后端服务'
      };
    }
  }

  // 获取存储配置
  async getStorageConfig(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/storage/config`);
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: '获取存储配置失败'
      };
    }
  }

  // 设置存储路径
  async setStoragePath(storagePath: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/storage/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ storagePath })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: '设置存储路径失败'
      };
    }
  }

  // 获取存储统计
  async getStorageStats(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/storage/stats`);
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: '获取存储统计失败'
      };
    }
  }

  // 获取文件列表
  async getFileList(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/list`);
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: '获取文件列表失败'
      };
    }
  }

  // 下载文件
  async downloadFile(filename: string): Promise<{ success: boolean; blob?: Blob; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/download/${encodeURIComponent(filename)}`);
      
      if (response.ok) {
        const blob = await response.blob();
        return {
          success: true,
          blob
        };
      } else {
        const result = await response.json();
        return {
          success: false,
          message: result.message || '下载失败'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '下载文件失败'
      };
    }
  }

  // 获取文件预览URL
  getPreviewUrl(filename: string): string {
    return `${this.baseUrl}/preview/${encodeURIComponent(filename)}`;
  }

  // 预览文件
  async previewFile(filename: string): Promise<{ success: boolean; url?: string; message?: string }> {
    try {
      // 检查文件是否存在
      const existsResult = await this.fileExists(filename);
      if (!existsResult.success || !existsResult.data?.exists) {
        return {
          success: false,
          message: '文件不存在'
        };
      }

      // 返回预览URL
      return {
        success: true,
        url: this.getPreviewUrl(filename)
      };
    } catch (error) {
      return {
        success: false,
        message: '预览文件失败'
      };
    }
  }

  // 删除文件
  async deleteFile(filename: string): Promise<{ success: boolean; message: string }> {
    try {
      // 注入当前用户信息到请求头，便于后端进行删除权限校验
      const headers: Record<string, string> = {};
      try {
        const raw = localStorage.getItem('currentUser');
        const currentUser = raw ? JSON.parse(raw) : {};
        if (currentUser?.id) headers['X-User-Id'] = String(currentUser.id);
        if (currentUser?.role) headers['X-User-Role'] = String(currentUser.role);
      } catch {}

      const response = await fetch(`${this.baseUrl}/delete/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: '删除文件失败'
      };
    }
  }

  // 检查文件是否存在
  async fileExists(filename: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/exists/${encodeURIComponent(filename)}`);
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: '检查文件失败'
      };
    }
  }
}

export const backendStorageService = new BackendStorageService();