import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box 
      component="footer" 
      sx={{ 
        width: '100%',
        py: 4, 
        borderTop: '1px solid #dee2e6',
        bgcolor: '#ffffff',
        position: 'relative',
      }}
    >
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, 
        gap: 4,
        mb: 3,
        px: 3
      }}>
        {/* Company Info */}
        <Box>
          <Typography variant="h6" fontWeight="600" color="#212529" gutterBottom>
            Inventory Pro
          </Typography>
          <Typography variant="body2" color="#6c757d" sx={{ mb: 2 }}>
            Complete inventory management solution for modern businesses.
          </Typography>
          <Typography variant="body2" color="#6c757d">
            © 2025 Inventory Pro. All rights reserved.
          </Typography>
        </Box>

        {/* Quick Links */}
        <Box>
          <Typography variant="h6" fontWeight="600" color="#212529" gutterBottom>
            Quick Links
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              Dashboard
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              Products
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              Categories
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              Warehouses
            </Typography>
          </Box>
        </Box>

        {/* Support */}
        <Box>
          <Typography variant="h6" fontWeight="600" color="#212529" gutterBottom>
            Support
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              Help Center
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              Documentation
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              Contact Support
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              System Status
            </Typography>
          </Box>
        </Box>

        {/* Legal */}
        <Box>
          <Typography variant="h6" fontWeight="600" color="#212529" gutterBottom>
            Legal
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              Privacy Policy
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              Terms of Service
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              Security
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6c757d', 
                cursor: 'pointer',
                '&:hover': { color: '#495057', textDecoration: 'underline' }
              }}
            >
              Compliance
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Bottom Bar */}
      <Box sx={{ 
        pt: 3, 
        px: 3,
        borderTop: '1px solid #f1f3f4',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="body2" color="#6c757d">
          Built with ❤️ for efficient inventory management
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6c757d', 
              cursor: 'pointer',
              '&:hover': { color: '#495057', textDecoration: 'underline' }
            }}
          >
            API Documentation
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6c757d', 
              cursor: 'pointer',
              '&:hover': { color: '#495057', textDecoration: 'underline' }
            }}
          >
            Release Notes
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6c757d', 
              cursor: 'pointer',
              '&:hover': { color: '#495057', textDecoration: 'underline' }
            }}
          >
            Feedback
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
