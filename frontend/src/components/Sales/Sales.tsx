import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

const Sales: React.FC = () => {
  return (
    <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
      <Typography variant="h4" fontWeight="700" gutterBottom color="#212529">
        Sales Orders
      </Typography>
      <Paper sx={{ p: 3, bgcolor: '#ffffff', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <Typography variant="body1" color="#6c757d">
          Sales order management interface coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Sales;
