const mpcService = require('./mpcService');
const blockchainService = require('./blockchainService');
const { v4: uuidv4 } = require('uuid');

class WalletService {
  constructor() {
    // 存储用户钱包数据
    this.userWallets = new Map();
  }

  /**
   * 创建多方计算钱包
   */
  async createWallet({ participantCount, threshold, userId }) {
    try {
      // 验证参数
      if (participantCount < 2 || threshold < 2 || threshold > participantCount) {
        throw new Error('无效的参与方数量或阈值设置');
      }

      const sessionId = uuidv4();
      
      // 初始化 MPC 密钥生成
      const mpcResult = await mpcService.startKeyGeneration({
        parties: participantCount,
        threshold
      });

      // 创建钱包记录
      const wallet = {
        id: uuidv4(),
        userId,
        name: `MPC钱包 ${new Date().toLocaleString()}`,
        type: 'mpc',
        participantCount,
        threshold,
        status: mpcResult.status === 'waiting_for_participants' ? 'creating' : 'active',
        sessionId: mpcResult.sessionId,
        address: mpcResult.address,
        publicKey: mpcResult.publicKey,
        createdAt: new Date().toISOString(),
        mpcData: {
          keyShares: mpcResult.keyShares,
          threshold: mpcResult.threshold,
          totalParties: mpcResult.totalParties
        }
      };

      // 存储到用户钱包列表
      if (!this.userWallets.has(userId)) {
        this.userWallets.set(userId, []);
      }
      this.userWallets.get(userId).push(wallet);

      return {
        wallet: {
          id: wallet.id,
          name: wallet.name,
          type: wallet.type,
          participantCount: wallet.participantCount,
          threshold: wallet.threshold,
          status: wallet.status,
          address: wallet.address,
          publicKey: wallet.publicKey,
          createdAt: wallet.createdAt
        },
        mpcSession: {
          sessionId: mpcResult.sessionId,
          keyShares: mpcResult.keyShares,
          totalParties: mpcResult.totalParties,
          status: mpcResult.status,
          participantCount: mpcResult.participantCount
        }
      };
    } catch (error) {
      throw new Error(`创建钱包失败: ${error.message}`);
    }
  }

  /**
   * 导入钱包
   */
  async importWallet({ walletData, privateKeyShare, userId }) {
    try {
      const wallet = {
        id: uuidv4(),
        userId,
        name: walletData.name || `导入钱包 ${new Date().toLocaleString()}`,
        type: 'imported',
        address: walletData.address,
        publicKey: walletData.publicKey,
        status: 'active',
        createdAt: new Date().toISOString(),
        importedAt: new Date().toISOString()
      };

      // 存储到用户钱包列表
      if (!this.userWallets.has(userId)) {
        this.userWallets.set(userId, []);
      }
      this.userWallets.get(userId).push(wallet);

      // 获取钱包余额
      let balance = 0;
      try {
        balance = await blockchainService.getBalance(wallet.address);
      } catch (error) {
        console.warn('获取钱包余额失败:', error.message);
      }

      return {
        wallet: {
          id: wallet.id,
          name: wallet.name,
          type: wallet.type,
          address: wallet.address,
          publicKey: wallet.publicKey,
          status: wallet.status,
          balance: balance.toString(),
          balanceEth: balance.toFixed(6) + ' ETH',
          createdAt: wallet.createdAt
        }
      };
    } catch (error) {
      throw new Error(`导入钱包失败: ${error.message}`);
    }
  }

  /**
   * 获取用户的钱包列表
   */
  async getWalletsByUser(userId) {
    try {
      const wallets = this.userWallets.get(userId) || [];
      
      // 为每个钱包获取最新信息
      const walletsWithBalance = await Promise.all(
        wallets.map(async (wallet) => {
          const walletInfo = {
            id: wallet.id,
            name: wallet.name,
            type: wallet.type,
            status: wallet.status,
            createdAt: wallet.createdAt,
            participantCount: wallet.participantCount,
            threshold: wallet.threshold
          };

          // 如果钱包有地址，获取余额
          if (wallet.address) {
            try {
              const balance = await blockchainService.getBalance(wallet.address);
              walletInfo.address = wallet.address;
              walletInfo.balance = balance.toString();
              walletInfo.balanceEth = balance.toFixed(6) + ' ETH';
            } catch (error) {
              console.warn(`获取钱包 ${wallet.id} 余额失败:`, error.message);
              walletInfo.balance = '0';
              walletInfo.balanceEth = '0 ETH';
            }
          }

          return walletInfo;
        })
      );

      return walletsWithBalance;
    } catch (error) {
      throw new Error(`获取钱包列表失败: ${error.message}`);
    }
  }

  /**
   * 获取钱包详情
   */
  async getWalletById(walletId) {
    try {
      // 在所有用户的钱包中查找
      for (const wallets of this.userWallets.values()) {
        const wallet = wallets.find(w => w.id === walletId);
        if (wallet) {
          const walletInfo = {
            id: wallet.id,
            name: wallet.name,
            type: wallet.type,
            status: wallet.status,
            createdAt: wallet.createdAt,
            participantCount: wallet.participantCount,
            threshold: wallet.threshold
          };

          // 如果钱包有地址，获取详细信息
          if (wallet.address) {
            try {
              const [balance, nonce] = await Promise.all([
                blockchainService.getBalance(wallet.address),
                blockchainService.getNonce(wallet.address)
              ]);

              walletInfo.address = wallet.address;
              walletInfo.publicKey = wallet.publicKey;
              walletInfo.balance = balance.toString();
              walletInfo.balanceEth = balance.toFixed(6) + ' ETH';
              walletInfo.nonce = nonce;
            } catch (error) {
              console.warn(`获取钱包 ${walletId} 详细信息失败:`, error.message);
            }
          }

          // 如果是 MPC 钱包且还在创建中，返回会话信息
          if (wallet.type === 'mpc' && wallet.status === 'creating') {
            walletInfo.sessionId = wallet.sessionId;
            walletInfo.mpcStatus = await mpcService.getSessionStatus(wallet.sessionId);
          }

          return walletInfo;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`获取钱包详情失败: ${error.message}`);
    }
  }

  /**
   * 获取钱包余额
   */
  async getWalletBalance(walletId) {
    try {
      const wallet = await this.findWalletById(walletId);
      if (!wallet || !wallet.address) {
        throw new Error('钱包不存在或未激活');
      }

      return await blockchainService.getBalance(wallet.address);
    } catch (error) {
      throw new Error(`获取钱包余额失败: ${error.message}`);
    }
  }

  /**
   * 删除钱包
   */
  async deleteWallet(walletId, userId) {
    try {
      const userWallets = this.userWallets.get(userId);
      if (!userWallets) {
        throw new Error('用户没有钱包');
      }

      const walletIndex = userWallets.findIndex(w => w.id === walletId);
      if (walletIndex === -1) {
        throw new Error('钱包不存在');
      }

      userWallets.splice(walletIndex, 1);
      return true;
    } catch (error) {
      throw new Error(`删除钱包失败: ${error.message}`);
    }
  }

  /**
   * 完成 MPC 钱包创建
   */
  async completeMPCWallet(walletId, mpcResult) {
    try {
      const wallet = await this.findWalletById(walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      if (wallet.type !== 'mpc' || wallet.status !== 'creating') {
        throw new Error('无效的钱包状态');
      }

      // 更新钱包信息
      wallet.address = mpcResult.walletAddress;
      wallet.publicKey = mpcResult.publicKey;
      wallet.status = 'active';
      wallet.completedAt = new Date().toISOString();

      // 获取初始余额
      let balance = 0;
      try {
        balance = await blockchainService.getBalance(wallet.address);
      } catch (error) {
        console.warn('获取初始余额失败:', error.message);
      }

      return {
        id: wallet.id,
        name: wallet.name,
        address: wallet.address,
        publicKey: wallet.publicKey,
        balance: balance.toString(),
        balanceEth: balance.toFixed(6) + ' ETH',
        status: wallet.status,
        completedAt: wallet.completedAt
      };
    } catch (error) {
      throw new Error(`完成 MPC 钱包创建失败: ${error.message}`);
    }
  }

  /**
   * 查找钱包
   */
  async findWalletById(walletId) {
    for (const wallets of this.userWallets.values()) {
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet) {
        return wallet;
      }
    }
    return null;
  }

  /**
   * 更新钱包名称
   */
  async updateWalletName(walletId, newName, userId) {
    try {
      const userWallets = this.userWallets.get(userId);
      if (!userWallets) {
        throw new Error('用户没有钱包');
      }

      const wallet = userWallets.find(w => w.id === walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      wallet.name = newName;
      wallet.updatedAt = new Date().toISOString();

      return {
        id: wallet.id,
        name: wallet.name,
        updatedAt: wallet.updatedAt
      };
    } catch (error) {
      throw new Error(`更新钱包名称失败: ${error.message}`);
    }
  }

  /**
   * 获取钱包统计信息
   */
  async getWalletStats(userId) {
    try {
      const wallets = this.userWallets.get(userId) || [];
      
      let totalBalance = 0;
      let activeWallets = 0;
      let mpcWallets = 0;

      for (const wallet of wallets) {
        if (wallet.status === 'active') {
          activeWallets++;
          
          if (wallet.type === 'mpc') {
            mpcWallets++;
          }

          if (wallet.address) {
            try {
              const balance = await blockchainService.getBalance(wallet.address);
              totalBalance += balance;
            } catch (error) {
              console.warn(`获取钱包 ${wallet.id} 余额失败:`, error.message);
            }
          }
        }
      }

      return {
        totalWallets: wallets.length,
        activeWallets,
        mpcWallets,
        totalBalance: totalBalance.toString(),
        totalBalanceEth: totalBalance.toFixed(6) + ' ETH'
      };
    } catch (error) {
      throw new Error(`获取钱包统计失败: ${error.message}`);
    }
  }
}

module.exports = new WalletService();