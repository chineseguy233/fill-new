const path = require('path');
const fs = require('fs-extra');

class StorageConfig {
  constructor() {
    // 默认存储路径
    this.defaultStoragePath = 'D:\\DOC_STORAGE';
    this.configFile = path.join(__dirname, 'storage-config.json');
    this.loadConfig();
  }

  // 加载存储配置
  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const config = fs.readJsonSync(this.configFile);
        this.storagePath = config.storagePath || this.defaultStoragePath;
      } else {
        this.storagePath = this.defaultStoragePath;
        this.saveConfig();
      }
    } catch (error) {
      console.error('加载存储配置失败:', error);
      this.storagePath = this.defaultStoragePath;
    }
  }

  // 保存存储配置
  saveConfig() {
    try {
      const config = {
        storagePath: this.storagePath,
        updatedAt: new Date().toISOString()
      };
      fs.writeJsonSync(this.configFile, config, { spaces: 2 });
    } catch (error) {
      console.error('保存存储配置失败:', error);
    }
  }

  // 获取存储路径
  getStoragePath() {
    return this.storagePath;
  }

  // 设置存储路径
  setStoragePath(newPath) {
    this.storagePath = newPath;
    this.saveConfig();
    return this.ensureStorageDirectory();
  }

  // 确保存储目录存在
  async ensureStorageDirectory() {
    try {
      await fs.ensureDir(this.storagePath);
      console.log(`存储目录已创建/确认: ${this.storagePath}`);
      return { success: true, path: this.storagePath };
    } catch (error) {
      console.error('创建存储目录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取文件完整路径
  getFilePath(filename) {
    return path.join(this.storagePath, filename);
  }

  // 获取存储统计信息
  async getStorageStats() {
    try {
      const files = await fs.readdir(this.storagePath);
      let totalSize = 0;
      const fileStats = [];

      for (const file of files) {
        const filePath = path.join(this.storagePath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
          fileStats.push({
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        }
      }

      return {
        success: true,
        stats: {
          totalFiles: fileStats.length,
          totalSize,
          files: fileStats,
          storagePath: this.storagePath
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 删除文件
  async deleteFile(filename) {
    try {
      const filePath = this.getFilePath(filename);
      await fs.remove(filePath);
      return { success: true, message: '文件删除成功' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 检查文件是否存在
  async fileExists(filename) {
    try {
      const filePath = this.getFilePath(filename);
      return await fs.pathExists(filePath);
    } catch (error) {
      return false;
    }
  }
}

module.exports = new StorageConfig();