import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import axios from 'axios';

const JoinWallet = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [member, setMember] = useState('');
  const [result, setResult] = useState('');
  const [open, setOpen] = useState(false);

  const handleJoin = async () => {
    try {
      const response = await axios.post('http://localhost:8080/api/mpc/join-session', {
        session_id: sessionId,
        member,
      });
      setResult(JSON.stringify(response.data, null, 2));
      setOpen(true);
    } catch (error) {
      setResult('加入失败，请检查Session ID和网络连接');
      setOpen(true);
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
            加入多方钱包
          </Typography>
          <TextField
            fullWidth
            label="Session ID"
            variant="outlined"
            margin="normal"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
          />
          <TextField
            fullWidth
            label="你的身份标识（如邮箱/用户名）"
            variant="outlined"
            margin="normal"
            value={member}
            onChange={e => setMember(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleJoin}
            fullWidth
            disabled={!sessionId || !member}
          >
            加入Session
          </Button>
        </CardContent>
      </Card>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>加入结果</DialogTitle>
        <DialogContent>
          <Typography variant="body2" component="pre" sx={{ mt: 2 }}>
            {result}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>完成</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JoinWallet; 