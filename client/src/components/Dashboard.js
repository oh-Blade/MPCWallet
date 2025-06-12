import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Typography, 
  Space,
  Table,
  Tag,
  Alert
} from 'antd';
import { 
  WalletOutlined, 
  TransactionOutlined, 
  DollarOutlined,
  PlusOutlined,
  EyeOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const { wallets, loading: walletLoading } = useWallet();
  const { networkStatus } = useNetwork();
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalBalance: '0.00',
    totalTransactions: 0,
    pendingTransactions: 0
  });

  const recentTransactions = [
    {
      key: '1',
      hash: '0x1234...5678',
      type: 'send',
      amount: '0.5 ETH',
      status: 'confirmed',
      timestamp: '2024-01-15 14:30:00'
    },
    {
      key: '2', 
      hash: '0x2345...6789',
      type: 'receive',
      amount: '1.2 ETH',
      status: 'pending',
      timestamp: '2024-01-15 13:15:00'
    }
  ];

  const transactionColumns = [
    {
      title: '交易哈希',
      dataIndex: 'hash',
      key: 'hash',
      render: (hash) => (
        <Button type="link" size="small">
          {hash}
        </Button>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'send' ? 'red' : 'green'}>
          {type === 'send' ? '发送' : '接收'}
        </Tag>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'confirmed' ? 'green' : 'orange'}>
          {status === 'confirmed' ? '已确认' : '待确认'}
        </Tag>
      )
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp'
    }
  ];

  useEffect(() => {
    // 计算统计数据，添加安全检查
    const walletsArray = Array.isArray(wallets) ? wallets : [];
    
    setStats({
      totalWallets: walletsArray.length,
      totalBalance: walletsArray.reduce((sum, wallet) => 
        sum + parseFloat(wallet.balance || 0), 0
      ).toFixed(4),
      totalTransactions: recentTransactions.length,
      pendingTransactions: recentTransactions.filter(tx => tx.status === 'pending').length
    });
  }, [wallets]);

  const quickActions = [
    {
      title: '创建钱包',
      description: '创建新的 MPC 钱包',
      icon: <PlusOutlined />,
      action: () => navigate('/wallet/create'),
      color: '#1890ff'
    },
    {
      title: '查看钱包',
      description: '管理现有钱包',
      icon: <EyeOutlined />,
      action: () => navigate('/wallet/list'),
      color: '#52c41a'
    },
    {
      title: '发送交易',
      description: '创建新交易',
      icon: <SendOutlined />,
      action: () => navigate('/transaction'),
      color: '#fa8c16'
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Title level={2} style={{ color: 'white', marginBottom: 8 }}>
          仪表板
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>
          欢迎使用 MPC 钱包管理系统
        </Paragraph>
      </div>

      {/* 网络状态提醒 */}
      {!networkStatus.connected && (
        <Alert
          message="网络连接异常"
          description="无法连接到区块链网络，部分功能可能不可用"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="钱包总数"
              value={stats.totalWallets}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="总余额 (ETH)"
              value={stats.totalBalance}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="总交易数"
              value={stats.totalTransactions}
              prefix={<TransactionOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理交易"
              value={stats.pendingTransactions}
              prefix={<TransactionOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 快速操作 */}
        <Col xs={24} lg={8}>
          <Card title="快速操作" className="action-card">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {quickActions.map((action, index) => (
                <Card.Grid 
                  key={index}
                  onClick={action.action}
                  style={{ 
                    width: '100%',
                    cursor: 'pointer',
                    padding: '16px'
                  }}
                >
                  <Space>
                    <div style={{ 
                      color: action.color, 
                      fontSize: '20px' 
                    }}>
                      {action.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {action.title}
                      </div>
                      <div style={{ 
                        color: '#666', 
                        fontSize: '12px' 
                      }}>
                        {action.description}
                      </div>
                    </div>
                  </Space>
                </Card.Grid>
              ))}
            </Space>
          </Card>
        </Col>

        {/* 最近交易 */}
        <Col xs={24} lg={16}>
          <Card 
            title="最近交易" 
            className="transaction-card"
            extra={
              <Button 
                type="link" 
                onClick={() => navigate('/transaction')}
              >
                查看全部
              </Button>
            }
          >
            <Table
              dataSource={recentTransactions}
              columns={transactionColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 