const fs = require('fs-extra');
const path = require('path');
const storageConfig = require('./config/storage');

// 只保留根目录
const folders = [
  { id: 'root', name: '根目录', path: '/', parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' }
];

// 保存文件夹数据到文件
async function resetFolders() {
  try {
    const folderDataPath = path.join(storageConfig.getStoragePath(), 'folders.json');
    await fs.writeFile(folderDataPath, JSON.stringify(folders, null, 2), 'utf8');
    console.log(`成功重置文件夹数据，现在只保留根目录。数据保存在: ${folderDataPath}`);
    return true;
  } catch (error) {
    console.error('重置文件夹数据失败:', error);
    return false;
  }
}

// 确保存储目录存在
async function ensureStorageDirectory() {
  try {
    const result = await storageConfig.ensureStorageDirectory();
    if (result.success) {
      console.log(`✅ 存储目录已准备就绪: ${result.path}`);
      return true;
    } else {
      console.warn(`⚠️ 存储目录创建失败: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error('确保存储目录存在失败:', error);
    return false;
  }
}

// 执行重置
async function main() {
  await ensureStorageDirectory();
  await resetFolders();
  console.log('文件夹数据重置完成！');
}

main().catch(console.error);