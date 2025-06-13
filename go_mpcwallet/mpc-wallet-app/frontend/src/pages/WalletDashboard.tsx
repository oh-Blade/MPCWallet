import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // 正确导入
import axios from 'axios';

interface SessionMember {
  id: string;
  status: 'pending' | 'active' | 'completed';
  joinedAt: string;
}

interface SessionInfo {
  id: string;
  status: string;
  members: SessionMember[];
  createdAt: string;
  updatedAt: string;
}

const WalletDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = new URLSearchParams(location.search).get('sessionId');
    if (sessionId) {
      fetchSessionStatus(sessionId);
    }
  }, [location]);

  const fetchSessionStatus = async (sessionId: string) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/mpc/session-status?session_id=${sessionId}`);
      setSessionInfo(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch session status');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Grid container spacing={3}>
        <Grid item={true} xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Wallet Session Status
              </Typography>
              {sessionInfo && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      Session ID: {sessionInfo.id}
                    </Typography>
                    <Chip
                      label={sessionInfo.status}
                      color={getStatusColor(sessionInfo.status)}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Participants
                  </Typography>
                  <List>
                    {sessionInfo.members.map((member) => (
                      <ListItem key={member.id}>
                        <ListItemAvatar>
                          <Avatar>{member.id[0].toUpperCase()}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={member.id}
                          secondary={`Joined: ${new Date(member.joinedAt).toLocaleString()}`}
                        />
                        <Chip
                          label={member.status}
                          color={getStatusColor(member.status)}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/send')}
            fullWidth
          >
            Send Transaction
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WalletDashboard; 