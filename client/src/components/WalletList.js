import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag,
  Modal,
  Descriptions,
  message,
  Input,
  Tooltip
} from 'antd';
import { 
  EyeOutlined, 
  SendOutlined, 
  CopyOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const WalletList = () => {
  const navigate = useNavigate();
  const { wallets, refreshWallets, getWalletBalance, loading } = useWallet();
  const { networkStatus } = useNetwork();
  
  const [filteredWallets, setFilteredWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setFilteredWallets(wallets);
  }, [wallets]);

  const handleSearch = (value) => {
    const filtered = wallets.filter(wallet => 
      wallet.name.toLowerCase().includes(value.toLowerCase()) ||
      wallet.address.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredWallets(filtered);
  };

  const handleRefreshBalances = async () => {
    setRefreshing(true);
    try {
      for (const wallet of wallets) {
        await getWalletBalance(wallet.address);
      }
      await refreshWallets();
      message.success('余额刷新成功');
    } catch (error) {
      message.error('余额刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    message.success(`${type}已复制到剪贴板`);
  };

  const showWalletDetail = (wallet) => {
    setSelectedWallet(wallet);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: '钱包名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.description}
            </div>
          )}
        </div>
      )
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (address) => (
        <Space>
          <Text code style={{ fontSize: '12px' }}>
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
          </Text>
          <Tooltip title="复制地址">
            <Button 
              type="text" 
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(address, '地址')}
            />
          </Tooltip>
        </Space>
      )
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {balance || '0.0000'} ETH
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            ≈ ${((parseFloat(balance || 0)) * 2000).toFixed(2)}
          </div>
        </div>
      )
    },
    {
      title: 'MPC 配置',
      key: 'mpcConfig',
      render: (_, record) => (
        <Space>
          <Tag color="blue">{record.parties}方</Tag>
          <Tag color="green">{record.threshold}签名</Tag>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status = 'active') => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? '活跃' : '待激活'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time) => new Date(time).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => showWalletDetail(record)}
            />
          </Tooltip>
          <Tooltip title="发送交易">
            <Button 
              type="text" 
              icon={<SendOutlined />}
              onClick={() => navigate('/transaction', { 
                state: { wallet: record } 
              })}
            />
          </Tooltip>
          <Tooltip title="生成二维码">
            <Button 
              type="text" 
              icon={<QrcodeOutlined />}
              onClick={() => {/* TODO: 显示二维码 */}}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="wallet-list-container">
      <div className="page-header">
        <Title level={2} style={{ color: 'white' }}>
          钱包管理
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.8)' }}>
          管理您的所有 MPC 钱包
        </Paragraph>
      </div>

      <Card className="wallet-list-card">
        <div className="list-header">
          <Space>
            <Search
              placeholder="搜索钱包名称或地址"
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefreshBalances}
              loading={refreshing}
              disabled={!networkStatus.connected}
            >
              刷新余额
            </Button>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/wallet/create')}
            >
              创建钱包
            </Button>
          </Space>
        </div>

        <Table
          dataSource={filteredWallets}
          columns={columns}
          rowKey="address"
          loading={loading}
          pagination={{
            total: filteredWallets.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个钱包`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 钱包详情弹窗 */}
      <Modal
        title="钱包详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="transaction" 
            type="primary"
            onClick={() => {
              setDetailVisible(false);
              navigate('/transaction', { 
                state: { wallet: selectedWallet } 
              });
            }}
          >
            发送交易
          </Button>
        ]}
        width={800}
      >
        {selectedWallet && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="钱包名称" span={2}>
              {selectedWallet.name}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {selectedWallet.description || '无描述'}
            </Descriptions.Item>
            <Descriptions.Item label="钱包地址" span={2}>
              <Space>
                <Text code>{selectedWallet.address}</Text>
                <Button 
                  type="link" 
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(selectedWallet.address, '地址')}
                >
                  复制
                </Button>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="余额">
              {selectedWallet.balance || '0.0000'} ETH
            </Descriptions.Item>
            <Descriptions.Item label="估值">
              ≈ ${((parseFloat(selectedWallet.balance || 0)) * 2000).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="参与方数量">
              {selectedWallet.parties}
            </Descriptions.Item>
            <Descriptions.Item label="签名阈值">
              {selectedWallet.threshold}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {new Date(selectedWallet.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="公钥" span={2}>
              <Text code style={{ wordBreak: 'break-all' }}>
                {selectedWallet.publicKey}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default WalletList; 