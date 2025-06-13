import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';
import { ethers } from 'ethers';

interface TransactionData {
  to: string;
  amount: string;
  sessionId: string;
}

const SendTransaction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mpcData, setMpcData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<TransactionData>({
    to: '',
    amount: '',
    sessionId: '',
  });

  useEffect(() => {
    const sessionId = new URLSearchParams(location.search).get('sessionId');
    if (sessionId) {
      setFormData(prev => ({ ...prev, sessionId }));
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 验证输入
      if (!ethers.utils.isAddress(formData.to)) {
        throw new Error('Invalid Ethereum address');
      }

      const amount = ethers.utils.parseEther(formData.amount);
      if (amount.lte(0)) {
        throw new Error('Amount must be greater than 0');
      }

      // 准备交易数据
      const txData = {
        to: formData.to,
        value: amount.toString(),
        sessionId: formData.sessionId,
      };

      // 发起交易签名请求
      const response = await axios.post('http://localhost:8080/api/mpc/sign-tx', txData);
      setMpcData(JSON.stringify(response.data, null, 2));
      setOpen(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send transaction');
    } finally {
      setLoading(false);
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
            Send Transaction
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="To Address"
              variant="outlined"
              margin="normal"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Amount (ETH)"
              variant="outlined"
              margin="normal"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              inputProps={{ step: "0.000000000000000001" }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Send'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>MPC Signature Required</DialogTitle>
        <DialogContent>
          <Typography variant="body2" component="pre" sx={{ mt: 2 }}>
            {mpcData}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Please share this data with other participants to complete the transaction signature.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SendTransaction; 