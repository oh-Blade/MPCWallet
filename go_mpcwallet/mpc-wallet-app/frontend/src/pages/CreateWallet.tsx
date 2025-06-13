import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import axios from 'axios';

const CreateWallet = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [inviteData, setInviteData] = useState('');
  const [creator, setCreator] = useState('');
  const [sessionId, setSessionId] = useState('');

  const handleCreateSession = async () => {
    try {
      const response = await axios.post('http://localhost:8080/api/mpc/create-session', {
        creator,
        invite_data: 'MPC协议初始化数据', // 这里可替换为真实MPC协议数据
      });
      setSessionId(response.data.id);
      setInviteData(JSON.stringify(response.data, null, 2));
      setOpen(true);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    navigate('/wallet');
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            创建多方钱包（发起方）
          </Typography>
          <TextField
            fullWidth
            label="你的身份标识（如邮箱/用户名）"
            variant="outlined"
            margin="normal"
            value={creator}
            onChange={e => setCreator(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateSession}
            fullWidth
            disabled={!creator}
          >
            创建钱包Session
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>邀请其他方加入</DialogTitle>
        <DialogContent>
          <Typography variant="body2" component="pre" sx={{ mt: 2 }}>
            {inviteData}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            请将以上数据复制给其他参与方，他们可通过"加入钱包"功能加入此Session。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>完成</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateWallet; 