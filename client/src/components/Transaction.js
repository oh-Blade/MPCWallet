import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Typography, 
  Space,
  Alert,
  Divider,
  Steps,
  Progress,
  Table,
  Tag,
  Modal,
  InputNumber
} from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useMPC } from '../contexts/MPCContext';
import { useNetwork } from '../contexts/NetworkContext';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const Transaction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { wallets, getWalletBalance } = useWallet();
  const { startSigning, signingProgress } = useMPC();
  const { networkStatus, estimateGas } = useNetwork();
  
  const [form] = Form.useForm();
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [signing, setSigning] = useState(false);
  const [recentTransactions] = useState([
    {
      key: '1',
      hash: '0x1234...5678',
      to: '0xabcd...efgh',
      amount: '0.5 ETH',
      status: 'confirmed',
      timestamp: '2024-01-15 14:30:00'
    }
  ]);

  const steps = [
    { title: '交易配置', description: '设置交易参数' },
    { title: 'MPC 签名', description: '多方协作签名' },
    { title: '广播交易', description: '发送到网络' },
    { title: '交易完成', description: '等待确认' }
  ];

  useEffect(() => {
    // 从路由状态中获取预选钱包
    if (location.state?.wallet) {
      setSelectedWallet(location.state.wallet);
      form.setFieldsValue({ 
        fromWallet: location.state.wallet.address 
      });
    }
  }, [location.state, form]);

  const handleWalletChange = (walletAddress) => {
    const wallet = wallets.find(w => w.address === walletAddress);
    setSelectedWallet(wallet);
  };

  const handleTransactionSubmit = async (values) => {
    setTransactionData(values);
    
    // 估算 Gas
    try {
      const estimate = await estimateGas({
        to: values.to,
        value: values.amount,
        from: values.fromWallet
      });
      setGasEstimate(estimate);
      setCurrentStep(1);
      
      // 开始 MPC 签名流程
      handleMPCSigning(values);
    } catch (error) {
      console.error('Gas 估算失败:', error);
    }
  };

  const handleMPCSigning = async (txData) => {
    setSigning(true);
    try {
      const transactionData = {
        to: txData.to,
        value: txData.amount,
        gasLimit: gasEstimate?.gasLimit,
        gasPrice: gasEstimate?.gasPrice
      };
      
      const walletConfig = {
        address: selectedWallet.address,
        threshold: selectedWallet.threshold,
        parties: selectedWallet.parties
      };
      
      const signingResult = await startSigning(transactionData, walletConfig);

      if (signingResult.success) {
        setCurrentStep(2);
        // 模拟交易广播
        setTimeout(() => {
          setCurrentStep(3);
          setSigning(false);
        }, 2000);
      }
    } catch (error) {
      console.error('MPC 签名失败:', error);
      setSigning(false);
    }
  };

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
      title: '接收地址',
      dataIndex: 'to',
      key: 'to',
      render: (to) => (
        <Text code>{`${to.slice(0, 6)}...${to.slice(-4)}`}</Text>
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card title="创建交易" className="step-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleTransactionSubmit}
            >
              <Form.Item
                name="fromWallet"
                label="发送钱包"
                rules={[{ required: true, message: '请选择发送钱包' }]}
              >
                <Select 
                  placeholder="选择钱包"
                  onChange={handleWalletChange}
                >
                  {wallets.map(wallet => (
                    <Option key={wallet.address} value={wallet.address}>
                      <div>
                        <div>{wallet.name}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {wallet.address} • {wallet.balance || '0.0000'} ETH
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="to"
                label="接收地址"
                rules={[
                  { required: true, message: '请输入接收地址' },
                  { 
                    pattern: /^0x[a-fA-F0-9]{40}$/, 
                    message: '请输入有效的以太坊地址' 
                  }
                ]}
              >
                <Input placeholder="0x..." />
              </Form.Item>

              <Form.Item
                name="amount"
                label="发送金额 (ETH)"
                rules={[
                  { required: true, message: '请输入发送金额' },
                  { 
                    type: 'number', 
                    min: 0.000001, 
                    message: '金额必须大于 0.000001 ETH' 
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.0"
                  step={0.001}
                  precision={6}
                />
              </Form.Item>

              <Form.Item
                name="gasPrice"
                label="Gas 价格 (Gwei)"
                initialValue={20}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="20"
                  min={1}
                />
              </Form.Item>

              {selectedWallet && (
                <Alert
                  message="钱包信息"
                  description={
                    <div>
                      <p>钱包: {selectedWallet.name}</p>
                      <p>余额: {selectedWallet.balance || '0.0000'} ETH</p>
                      <p>MPC 配置: {selectedWallet.parties}方 {selectedWallet.threshold}签名</p>
                    </div>
                  }
                  type="info"
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    disabled={!networkStatus.connected}
                  >
                    创建交易
                  </Button>
                  <Button onClick={() => navigate('/dashboard')}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        );

      case 1:
        return (
          <Card title="MPC 签名" className="step-card">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message="正在进行多方签名"
                description="请等待所有参与方完成签名确认。"
                type="info"
                showIcon
              />

              {signing && (
                <div style={{ textAlign: 'center' }}>
                  <Progress 
                    percent={signingProgress} 
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <Text type="secondary">
                    签名进度: {signingProgress}%
                  </Text>
                </div>
              )}

              {transactionData && gasEstimate && (
                <div>
                  <Title level={4}>交易详情</Title>
                  <div className="transaction-info">
                    <p><strong>发送方:</strong> {selectedWallet?.name}</p>
                    <p><strong>接收方:</strong> {transactionData.to}</p>
                    <p><strong>金额:</strong> {transactionData.amount} ETH</p>
                    <p><strong>Gas 限制:</strong> {gasEstimate.gasLimit}</p>
                    <p><strong>Gas 价格:</strong> {gasEstimate.gasPrice} Gwei</p>
                    <p><strong>预估费用:</strong> {gasEstimate.estimatedFee} ETH</p>
                  </div>
                </div>
              )}
            </Space>
          </Card>
        );

      case 2:
        return (
          <Card title="广播交易" className="step-card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', color: '#1890ff', marginBottom: 16 }}>
                📡
              </div>
              <Title level={3}>正在广播交易</Title>
              <Paragraph>
                交易已签名完成，正在广播到区块链网络...
              </Paragraph>
            </div>
          </Card>
        );

      case 3:
        return (
          <Card title="交易完成" className="step-card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }}>
                ✅
              </div>
              <Title level={3}>交易发送成功！</Title>
              <Paragraph>
                交易已成功发送到区块链网络，正在等待确认。
              </Paragraph>
              
              <Space size="large">
                <Button 
                  type="primary" 
                  onClick={() => {
                    setCurrentStep(0);
                    form.resetFields();
                    setTransactionData(null);
                    setGasEstimate(null);
                  }}
                >
                  创建新交易
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  返回首页
                </Button>
              </Space>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="transaction-container">
      <div className="page-header">
        <Title level={2} style={{ color: 'white' }}>
          交易管理
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.8)' }}>
          创建和管理 MPC 钱包交易
        </Paragraph>
      </div>

      {!networkStatus.connected && (
        <Alert
          message="网络连接异常"
          description="无法连接到区块链网络，无法创建交易"
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Card className="steps-card">
        <Steps current={currentStep} items={steps} />
      </Card>

      <div style={{ marginTop: 24 }}>
        {renderStepContent()}
      </div>

      <Divider style={{ margin: '48px 0' }} />

      {/* 最近交易 */}
      <Card title="最近交易" className="recent-transactions-card">
        <Table
          dataSource={recentTransactions}
          columns={transactionColumns}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Transaction; 