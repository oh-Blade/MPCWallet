import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Steps, 
  Typography, 
  Space,
  Alert,
  Progress,
  Spin
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useMPC } from '../contexts/MPCContext';
import { CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const WalletCreate = () => {
  const navigate = useNavigate();
  const { createWallet } = useWallet();
  const { startKeyGeneration, keyGenProgress, generateInvitationData } = useMPC();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [walletConfig, setWalletConfig] = useState(null);
  const [creating, setCreating] = useState(false);
  const [invitationData, setInvitationData] = useState(null);

  const steps = [
    {
      title: '钱包配置',
      description: '设置钱包基本信息'
    },
    {
      title: 'MPC 密钥生成',
      description: '生成多方计算密钥'
    },
    {
      title: '完成创建',
      description: '钱包创建完成'
    }
  ];

  const handleConfigSubmit = (values) => {
    setWalletConfig(values);
    setCurrentStep(1);
    handleKeyGeneration(values);
  };

  const handleKeyGeneration = async (config) => {
    setCreating(true);
    try {
      // 启动 MPC 密钥生成流程
      const keyGenResult = await startKeyGeneration({
        parties: parseInt(config.parties),
        threshold: parseInt(config.threshold),
        walletName: config.name
      });

      if (keyGenResult.success) {
        // 创建钱包
        const walletData = {
          name: config.name,
          description: config.description,
          parties: parseInt(config.parties),     // 确保是数字类型
          threshold: parseInt(config.threshold), // 确保是数字类型
          keyShares: keyGenResult.keyShares,
          publicKey: keyGenResult.publicKey,
          address: keyGenResult.address
        };

        await createWallet(walletData);
        
        // 生成邀请数据供其他参与方加入
        const inviteData = generateInvitationData(config, keyGenResult.sessionId);
        setInvitationData(inviteData);
        
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('钱包创建失败:', error);
    } finally {
      setCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card title="钱包配置" className="step-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleConfigSubmit}
              initialValues={{
                parties: '3',
                threshold: '2'
              }}
            >
              <Form.Item
                name="name"
                label="钱包名称"
                rules={[
                  { required: true, message: '请输入钱包名称' },
                  { min: 2, max: 50, message: '钱包名称长度应在2-50字符之间' }
                ]}
              >
                <Input placeholder="输入钱包名称" />
              </Form.Item>

              <Form.Item
                name="description"
                label="钱包描述"
                rules={[
                  { max: 200, message: '描述长度不能超过200字符' }
                ]}
              >
                <Input.TextArea 
                  placeholder="输入钱包描述（可选）"
                  rows={3}
                />
              </Form.Item>

              <Form.Item
                name="parties"
                label="参与方数量"
                rules={[{ required: true, message: '请选择参与方数量' }]}
              >
                <Input 
                  type="number" 
                  min={2} 
                  max={10}
                  placeholder="2-10"
                />
              </Form.Item>

              <Form.Item
                name="threshold"
                label="签名阈值"
                rules={[{ required: true, message: '请设置签名阈值' }]}
              >
                <Input 
                  type="number" 
                  min={1} 
                  max={9}
                  placeholder="最少签名数量"
                />
              </Form.Item>

              <Alert
                message="MPC 配置说明"
                description="参与方数量是指参与钱包管理的总人数，签名阈值是指执行交易时需要的最少签名数量。例如：3个参与方，2个签名阈值表示任意2人即可执行交易。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    下一步
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
          <Card title="MPC 密钥生成" className="step-card">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message="正在生成 MPC 密钥"
                description="请耐心等待密钥生成完成，这个过程可能需要几分钟时间。"
                type="info"
                showIcon
              />

              {creating && (
                <div style={{ textAlign: 'center' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>
                    <Progress 
                      percent={keyGenProgress} 
                      status="active"
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                    <Text type="secondary">
                      密钥生成进度: {keyGenProgress}%
                    </Text>
                  </div>
                </div>
              )}

              {walletConfig && (
                <div>
                  <Title level={4}>钱包配置信息</Title>
                  <div className="config-info">
                    <p><strong>钱包名称:</strong> {walletConfig.name}</p>
                    <p><strong>参与方数量:</strong> {walletConfig.parties}</p>
                    <p><strong>签名阈值:</strong> {walletConfig.threshold}</p>
                    {walletConfig.description && (
                      <p><strong>描述:</strong> {walletConfig.description}</p>
                    )}
                  </div>
                </div>
              )}
            </Space>
          </Card>
        );

      case 2:
        return (
          <Card title="创建完成" className="step-card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }}>
                ✅
              </div>
              <Title level={3}>钱包创建成功！</Title>
              <Paragraph>
                您的 MPC 钱包已成功创建，请分享邀请数据给其他参与方。
              </Paragraph>

              {invitationData && (
                <div style={{ textAlign: 'left', marginTop: 24 }}>
                  <Alert
                    message="邀请其他参与方"
                    description="请将下面的邀请数据发送给其他参与方，他们可以使用这些数据加入您的钱包。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  <div style={{ marginBottom: 16 }}>
                    <Title level={4}>邀请数据</Title>
                    <div style={{
                      background: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      maxHeight: '200px',
                      overflow: 'auto',
                      border: '1px solid #d9d9d9'
                    }}>
                      {JSON.stringify(invitationData, null, 2)}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Button 
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(invitationData, null, 2));
                          message.success('邀请数据已复制到剪贴板');
                        }}
                      >
                        复制邀请数据
                      </Button>
                    </div>
                  </div>

                  <Alert
                    message="重要说明"
                    description={`参与方数量设置为 ${walletConfig?.parties} 人，需要至少 ${walletConfig?.threshold} 人参与才能执行交易。请确保所有参与方都成功加入钱包。`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                </div>
              )}
              
              <Space size="large">
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => navigate('/wallet/list')}
                >
                  查看钱包
                </Button>
                <Button 
                  size="large"
                  onClick={() => navigate('/dashboard')}
                >
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
    <div className="wallet-create-container">
      <div className="page-header">
        <Title level={2} style={{ color: 'white' }}>
          创建 MPC 钱包
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.8)' }}>
          通过多方计算技术创建安全的去中心化钱包
        </Paragraph>
      </div>

      <Card className="steps-card">
        <Steps current={currentStep} items={steps} />
      </Card>

      <div style={{ marginTop: 24 }}>
        {renderStepContent()}
      </div>
    </div>
  );
};

export default WalletCreate; 