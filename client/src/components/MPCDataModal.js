import React from 'react';
import { Modal, Typography, Input, Button, Space, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import JsonView from '@uiw/react-json-view';
import { useMPC } from '../contexts/MPCContext';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const MPCDataModal = () => {
  const { 
    modalVisible, 
    modalData, 
    modalType,
    closeModal,
    submitMPCData 
  } = useMPC();

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(modalData, null, 2));
    message.success('数据已复制到剪贴板');
  };

  const handleSubmit = (inputData) => {
    try {
      const parsedData = JSON.parse(inputData);
      submitMPCData(parsedData);
      message.success('数据提交成功');
    } catch (error) {
      message.error('数据格式错误');
    }
  };

  return (
    <Modal
      title={`MPC 数据交换 - ${modalType === 'send' ? '发送' : '接收'}`}
      open={modalVisible}
      onCancel={closeModal}
      width={800}
      footer={null}
    >
      {modalType === 'send' ? (
        <div>
          <Title level={4}>请将以下数据发送给其他参与方:</Title>
          <Space style={{ marginBottom: 16 }}>
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              复制数据
            </Button>
          </Space>
          <JsonView value={modalData} />
        </div>
      ) : (
        <div>
          <Title level={4}>请粘贴从其他参与方收到的数据:</Title>
          <TextArea
            rows={10}
            placeholder="粘贴 JSON 数据..."
            onPressEnter={(e) => {
              if (e.ctrlKey || e.metaKey) {
                handleSubmit(e.target.value);
              }
            }}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button 
              type="primary"
              onClick={(e) => {
                const textArea = e.target.closest('.ant-modal').querySelector('textarea');
                handleSubmit(textArea.value);
              }}
            >
              提交数据
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MPCDataModal; 