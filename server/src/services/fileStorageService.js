const fs = require('fs').promises;
const path = require('path');

class FileStorageService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.walletsFile = path.join(this.dataDir, 'wallets.json');
    this.backupDir = path.join(this.dataDir, 'backups');
    this.initializeStorage();
  }

  /**
   * 初始化存储目录
   */
  async initializeStorage() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // 如果钱包文件不存在，创建一个空的
      try {
        await fs.access(this.walletsFile);
      } catch (error) {
        await this.saveWallets({});
      }
      
      console.log('文件存储服务初始化完成');
    } catch (error) {
      console.error('初始化文件存储失败:', error);
    }
  }

  /**
   * 读取所有钱包数据
   */
  async loadWallets() {
    try {
      const data = await fs.readFile(this.walletsFile, 'utf8');
      const walletsData = JSON.parse(data);
      
      // 将普通对象转换为 Map
      const walletsMap = new Map();
      for (const [userId, userWallets] of Object.entries(walletsData)) {
        walletsMap.set(userId, userWallets);
      }
      
      console.log(`已加载 ${walletsMap.size} 个用户的钱包数据`);
      return walletsMap;
    } catch (error) {
      console.error('读取钱包文件失败:', error);
      return new Map();
    }
  }

  /**
   * 保存所有钱包数据
   */
  async saveWallets(walletsMap) {
    try {
      // 创建备份
      await this.createBackup();
      
      // 将 Map 转换为普通对象以便序列化
      const walletsData = {};
      if (walletsMap instanceof Map) {
        for (const [userId, userWallets] of walletsMap) {
          walletsData[userId] = userWallets;
        }
      } else {
        Object.assign(walletsData, walletsMap);
      }
      
      const dataString = JSON.stringify(walletsData, null, 2);
      await fs.writeFile(this.walletsFile, dataString, 'utf8');
      
      console.log('钱包数据已保存到文件');
    } catch (error) {
      console.error('保存钱包文件失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据备份
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `wallets-backup-${timestamp}.json`);
      
      try {
        await fs.access(this.walletsFile);
        await fs.copyFile(this.walletsFile, backupFile);
        console.log(`创建备份: ${backupFile}`);
      } catch (error) {
        // 如果原文件不存在，跳过备份
      }
      
      // 只保留最近的10个备份文件
      await this.cleanupOldBackups();
    } catch (error) {
      console.error('创建备份失败:', error);
    }
  }

  /**
   * 清理旧的备份文件
   */
  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('wallets-backup-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          time: file.match(/wallets-backup-(.+)\.json$/)?.[1]
        }))
        .sort((a, b) => b.time.localeCompare(a.time)); // 按时间倒序排列

      // 删除多余的备份文件（保留最新的10个）
      if (backupFiles.length > 10) {
        const filesToDelete = backupFiles.slice(10);
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          console.log(`删除旧备份: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('清理备份文件失败:', error);
    }
  }

  /**
   * 保存单个用户的钱包数据
   */
  async saveUserWallets(userId, userWallets) {
    try {
      const allWallets = await this.loadWallets();
      allWallets.set(userId, userWallets);
      await this.saveWallets(allWallets);
    } catch (error) {
      console.error(`保存用户 ${userId} 钱包数据失败:`, error);
      throw error;
    }
  }

  /**
   * 读取单个用户的钱包数据
   */
  async loadUserWallets(userId) {
    try {
      const allWallets = await this.loadWallets();
      return allWallets.get(userId) || [];
    } catch (error) {
      console.error(`读取用户 ${userId} 钱包数据失败:`, error);
      return [];
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats() {
    try {
      const stats = await fs.stat(this.walletsFile);
      const backupFiles = await fs.readdir(this.backupDir);
      const backupCount = backupFiles.filter(file => 
        file.startsWith('wallets-backup-') && file.endsWith('.json')
      ).length;

      return {
        walletFileSize: stats.size,
        lastModified: stats.mtime,
        backupCount,
        dataDirectory: this.dataDir
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      return null;
    }
  }

  /**
   * 验证数据完整性
   */
  async validateData() {
    try {
      const data = await fs.readFile(this.walletsFile, 'utf8');
      JSON.parse(data); // 验证是否为有效的JSON
      return true;
    } catch (error) {
      console.error('数据验证失败:', error);
      return false;
    }
  }
}

// 创建单例实例
const fileStorageService = new FileStorageService();

module.exports = fileStorageService; 