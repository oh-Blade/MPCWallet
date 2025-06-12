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
  Spin,
  message
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useMPC } from '../contexts/MPCContext';
import JsonView from '@uiw/react-json-view';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const WalletJoin = () => {
  const navigate = useNavigate();
  const { joinWallet } = useWallet();
  const { joinKeyGeneration, keyGenProgress } = useMPC();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [invitationData, setInvitationData] = useState(null);
  const [joining, setJoining] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);

  const steps = [
    {
      title: '输入邀请信息',
      description: '粘贴邀请数据'
    },
    {
      title: '验证邀请',
      description: '确认钱包信息'
    },
    {
      title: '参与密钥生成',
      description: '多方协作生成密钥'
    },
    {
      title: '加入完成',
      description: '成功加入钱包'
    }
  ];

  const handleInvitationSubmit = async (values) => {
    try {
      const inviteData = JSON.parse(values.invitationData);
      
      // 验证邀请数据格式
      if (!inviteData.sessionId || !inviteData.walletName || !inviteData.participants || !inviteData.threshold) {
        throw new Error('邀请数据格式无效');
      }
      
      setInvitationData(inviteData);
      setWalletInfo({
        name: inviteData.walletName,
        participants: inviteData.participants,
        threshold: inviteData.threshold,
        creator: inviteData.creator,
        createdAt: inviteData.createdAt
      });
      setCurrentStep(1);
      
    } catch (error) {
      message.error('邀请数据格式错误，请检查输入');
    }
  };

  const handleJoinConfirm = async () => {
    setCurrentStep(2);
    setJoining(true);
    
    try {
      // 参与 MPC 密钥生成
      const joinResult = await joinKeyGeneration({
        sessionId: invitationData.sessionId,
        walletName: invitationData.walletName,
        participants: invitationData.participants,
        threshold: invitationData.threshold
      });

      if (joinResult.success) {
        // 将钱包信息保存到本地
        const walletData = {
          name: invitationData.walletName,
          participants: invitationData.participants,
          threshold: invitationData.threshold,
          sessionId: invitationData.sessionId,
          keyShares: joinResult.keyShares,
          publicKey: joinResult.publicKey,
          address: joinResult.address,
          role: 'participant' // 标记为参与者，非创建者
        };

        await joinWallet(walletData);
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('加入钱包失败:', error);
      message.error('加入钱包失败，请重试');
    } finally {
      setJoining(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card title="输入邀请信息" className="step-card">
            <Alert
              message="加入多方计算钱包"
              description="请粘贴钱包创建者提供的邀请数据，包含钱包配置和会话信息。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleInvitationSubmit}
            >
              <Form.Item
                name="invitationData"
                label="邀请数据"
                rules={[
                  { required: true, message: '请输入邀请数据' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      try {
                        JSON.parse(value);
                        return Promise.resolve();
                      } catch {
                        return Promise.reject(new Error('请输入有效的JSON格式数据'));
                      }
                    }
                  }
                ]}
              >
                <TextArea
                  placeholder='粘贴邀请数据，例如：
{
  "sessionId": "session_1234567890",
  "walletName": "我的MPC钱包",
  "participants": 3,
  "threshold": 2,
  "creator": "Alice",
  "createdAt": "2024-01-15T10:30:00Z"
}'
                  rows={10}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    验证邀请数据
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
          <Card title="确认钱包信息" className="step-card">
            <Alert
              message="邀请验证成功"
              description="请确认以下钱包信息，确认无误后点击加入钱包。"
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />

            {walletInfo && (
              <div className="wallet-info">
                <Title level={4}>钱包详情</Title>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '16px', 
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <p><strong>钱包名称:</strong> {walletInfo.name}</p>
                  <p><strong>参与方数量:</strong> {walletInfo.participants}</p>
                  <p><strong>签名阈值:</strong> {walletInfo.threshold}</p>
                  <p><strong>创建者:</strong> {walletInfo.creator}</p>
                  <p><strong>创建时间:</strong> {walletInfo.createdAt}</p>
                </div>
                
                <Alert
                  message="重要提醒"
                  description="加入钱包后，您将成为该多方计算钱包的参与者之一。请确保您信任其他参与方，并妥善保管您的密钥份额。"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              </div>
            )}

            <Space>
              <Button 
                type="primary" 
                onClick={handleJoinConfirm}
                size="large"
              >
                确认加入钱包
              </Button>
              <Button 
                onClick={() => setCurrentStep(0)}
                size="large"
              >
                返回修改
              </Button>
            </Space>
          </Card>
        );

      case 2:
        return (
          <Card title="参与密钥生成" className="step-card">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message="正在参与 MPC 密钥生成"
                description="请等待与其他参与方协作完成密钥生成过程。"
                type="info"
                showIcon
              />

              {joining && (
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

              {walletInfo && (
                <div>
                  <Title level={4}>正在加入的钱包</Title>
                  <div className="config-info">
                    <p><strong>钱包名称:</strong> {walletInfo.name}</p>
                    <p><strong>参与方数量:</strong> {walletInfo.participants}</p>
                    <p><strong>签名阈值:</strong> {walletInfo.threshold}</p>
                  </div>
                </div>
              )}
            </Space>
          </Card>
        );

      case 3:
        return (
          <Card title="加入成功" className="step-card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }}>
                🎉
              </div>
              <Title level={3}>成功加入钱包！</Title>
              <Paragraph>
                您已成功加入 MPC 钱包，现在可以参与该钱包的交易签名了。
              </Paragraph>
              
              <Space size="large">
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => navigate('/wallet/list')}
                >
                  查看我的钱包
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
    <div className="wallet-join-container">
      <div className="page-header">
        <Title level={2} style={{ color: 'white' }}>
          加入 MPC 钱包
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.8)' }}>
          通过邀请数据加入现有的多方计算钱包
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

export default WalletJoin; 