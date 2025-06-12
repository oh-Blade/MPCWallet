import React from 'react';
import { Layout, Menu, Space, Typography, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, 
  WalletOutlined, 
  TransactionOutlined,
  PlusOutlined,
  UnorderedListOutlined 
} from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/wallet',
      icon: <WalletOutlined />,
      label: '钱包管理',
      children: [
        {
          key: '/wallet/create',
          icon: <PlusOutlined />,
          label: '创建钱包',
        },
        {
          key: '/wallet/list',
          icon: <UnorderedListOutlined />,
          label: '钱包列表',
        },
      ],
    },
    {
      key: '/transaction',
      icon: <TransactionOutlined />,
      label: '交易管理',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <AntHeader className="header-container">
      <div className="header-content">
        <div className="header-brand">
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            🔐 MPC 钱包
          </Title>
        </div>
        
        <div className="header-menu">
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ 
              background: 'transparent',
              borderBottom: 'none'
            }}
          />
        </div>

        <div className="header-actions">
          <Space>
            <Button 
              type="primary" 
              ghost
              onClick={() => navigate('/wallet/create')}
            >
              创建新钱包
            </Button>
          </Space>
        </div>
      </div>
    </AntHeader>
  );
};

export default Header; 