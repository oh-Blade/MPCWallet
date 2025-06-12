const { ethers } = require('ethers');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.networkInfo = null;
    this.initialize();
  }

  async initialize() {
    try {
      const infuraProjectId = process.env.INFURA_PROJECT_ID;
      const network = process.env.ETHEREUM_NETWORK || 'goerli';
      
      if (!infuraProjectId) {
        throw new Error('INFURA_PROJECT_ID 未配置');
      }

      // 初始化 Infura 提供者
      this.provider = new ethers.JsonRpcProvider(
        `https://${network}.infura.io/v3/${infuraProjectId}`
      );

      // 获取网络信息
      this.networkInfo = await this.provider.getNetwork();
      
      console.log(`🌐 已连接到以太坊网络: ${this.networkInfo.name} (Chain ID: ${this.networkInfo.chainId})`);
    } catch (error) {
      console.error('区块链服务初始化失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取网络信息
   */
  async getNetworkInfo() {
    if (!this.networkInfo) {
      await this.initialize();
    }

    const latestBlock = await this.provider.getBlockNumber();
    const gasPrice = await this.provider.getFeeData();

    return {
      name: this.networkInfo.name,
      chainId: this.networkInfo.chainId.toString(),
      latestBlock,
      gasPrice: {
        gasPrice: gasPrice.gasPrice?.toString(),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
      }
    };
  }

  /**
   * 获取最新区块
   */
  async getLatestBlock() {
    const block = await this.provider.getBlock('latest');
    return {
      number: block.number,
      hash: block.hash,
      timestamp: block.timestamp,
      gasLimit: block.gasLimit.toString(),
      gasUsed: block.gasUsed.toString(),
      transactions: block.transactions.length
    };
  }

  /**
   * 获取账户余额
   */
  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      throw new Error(`获取余额失败: ${error.message}`);
    }
  }

  /**
   * 获取 Nonce
   */
  async getNonce(address) {
    try {
      return await this.provider.getTransactionCount(address);
    } catch (error) {
      throw new Error(`获取 Nonce 失败: ${error.message}`);
    }
  }

  /**
   * 验证地址格式
   */
  async validateAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取 ERC-20 代币余额
   */
  async getTokenBalance(address, tokenAddress) {
    try {
      // ERC-20 标准 ABI (只包含 balanceOf 方法)
      const erc20ABI = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function name() view returns (string)'
      ];

      const contract = new ethers.Contract(tokenAddress, erc20ABI, this.provider);
      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      throw new Error(`获取代币余额失败: ${error.message}`);
    }
  }

  /**
   * 获取代币信息
   */
  async getTokenInfo(tokenAddress) {
    try {
      const erc20ABI = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)'
      ];

      const contract = new ethers.Contract(tokenAddress, erc20ABI, this.provider);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: ethers.formatUnits(totalSupply, decimals)
      };
    } catch (error) {
      throw new Error(`获取代币信息失败: ${error.message}`);
    }
  }

  /**
   * 获取区块详情
   */
  async getBlock(blockNumber) {
    try {
      const block = await this.provider.getBlock(parseInt(blockNumber));
      if (!block) {
        return null;
      }

      return {
        number: block.number,
        hash: block.hash,
        parentHash: block.parentHash,
        timestamp: block.timestamp,
        gasLimit: block.gasLimit.toString(),
        gasUsed: block.gasUsed.toString(),
        miner: block.miner,
        difficulty: block.difficulty?.toString(),
        transactions: block.transactions.length,
        nonce: block.nonce
      };
    } catch (error) {
      throw new Error(`获取区块详情失败: ${error.message}`);
    }
  }

  /**
   * 搜索交易、地址或区块
   */
  async search(query) {
    try {
      // 检查是否是交易哈希
      if (query.length === 66 && query.startsWith('0x')) {
        try {
          const tx = await this.provider.getTransaction(query);
          if (tx) {
            return {
              type: 'transaction',
              data: await this.formatTransaction(tx)
            };
          }
        } catch (error) {
          // 继续检查其他类型
        }
      }

      // 检查是否是地址
      if (ethers.isAddress(query)) {
        const balance = await this.getBalance(query);
        const nonce = await this.getNonce(query);
        return {
          type: 'address',
          data: {
            address: query,
            balance: balance.toString(),
            balanceEth: balance.toFixed(6) + ' ETH',
            nonce
          }
        };
      }

      // 检查是否是区块号
      if (/^\d+$/.test(query)) {
        const block = await this.getBlock(query);
        if (block) {
          return {
            type: 'block',
            data: block
          };
        }
      }

      return {
        type: 'not_found',
        data: null
      };
    } catch (error) {
      throw new Error(`搜索失败: ${error.message}`);
    }
  }

  /**
   * 格式化交易数据
   */
  async formatTransaction(tx) {
    const receipt = await this.provider.getTransactionReceipt(tx.hash);
    
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value),
      gasLimit: tx.gasLimit.toString(),
      gasPrice: tx.gasPrice?.toString(),
      gasUsed: receipt?.gasUsed?.toString(),
      nonce: tx.nonce,
      blockNumber: tx.blockNumber,
      blockHash: tx.blockHash,
      transactionIndex: tx.index,
      status: receipt?.status,
      confirmations: await tx.confirmations()
    };
  }

  /**
   * 估算 Gas
   */
  async estimateGas(transaction) {
    try {
      const gasEstimate = await this.provider.estimateGas({
        from: transaction.from,
        to: transaction.to,
        value: transaction.value ? ethers.parseEther(transaction.value.toString()) : 0,
        data: transaction.data || '0x'
      });

      const feeData = await this.provider.getFeeData();

      return {
        gasEstimate: gasEstimate.toString(),
        gasPrice: feeData.gasPrice?.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        estimatedCost: ethers.formatEther(gasEstimate * (feeData.gasPrice || 0n))
      };
    } catch (error) {
      throw new Error(`估算 Gas 失败: ${error.message}`);
    }
  }

  /**
   * 广播交易
   */
  async broadcastTransaction(signedTransaction) {
    try {
      const tx = await this.provider.broadcastTransaction(signedTransaction);
      return tx.hash;
    } catch (error) {
      throw new Error(`广播交易失败: ${error.message}`);
    }
  }

  /**
   * 获取交易状态
   */
  async getTransactionStatus(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!tx) {
        return {
          status: 'not_found',
          message: '交易不存在'
        };
      }

      if (!receipt) {
        return {
          status: 'pending',
          message: '交易待确认'
        };
      }

      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
        confirmations: await tx.confirmations(),
        message: receipt.status === 1 ? '交易成功' : '交易失败'
      };
    } catch (error) {
      throw new Error(`获取交易状态失败: ${error.message}`);
    }
  }

  /**
   * 获取当前 Gas 价格
   */
  async getCurrentGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return parseFloat(ethers.formatUnits(feeData.gasPrice || 0n, 'gwei'));
    } catch (error) {
      throw new Error(`获取 Gas 价格失败: ${error.message}`);
    }
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(address, page = 1, limit = 20) {
    try {
      // 注意：这里使用简单的方法获取交易历史
      // 在生产环境中，建议使用 Etherscan API 或其他索引服务
      const latestBlock = await this.provider.getBlockNumber();
      const startBlock = Math.max(0, latestBlock - (page * limit * 10));
      
      const transactions = [];
      
      // 扫描最近的区块以查找相关交易
      for (let i = latestBlock; i > startBlock && transactions.length < limit; i--) {
        try {
          const block = await this.provider.getBlock(i, true);
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (tx.from === address || tx.to === address) {
                transactions.push(await this.formatTransaction(tx));
                if (transactions.length >= limit) break;
              }
            }
          }
        } catch (error) {
          // 跳过有问题的区块
          continue;
        }
      }

      return {
        transactions,
        page,
        limit,
        total: transactions.length,
        hasMore: transactions.length === limit
      };
    } catch (error) {
      throw new Error(`获取交易历史失败: ${error.message}`);
    }
  }
}

module.exports = new BlockchainService();