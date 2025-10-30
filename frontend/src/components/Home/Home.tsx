import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssessmentIcon from '@mui/icons-material/Assessment';

const features = [
  {
    icon: <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />, title: 'Inventory Control', desc: 'Track stock levels, manage products, and avoid stockouts with real-time inventory management.'
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />, title: 'Sales & Purchases', desc: 'Streamline your sales and purchase orders with integrated workflows and analytics.'
  },
  {
    icon: <LocalShippingIcon sx={{ fontSize: 40, color: 'info.main' }} />, title: 'Shipping & Warehousing', desc: 'Manage warehouses, shipping, and logistics with ease and accuracy.'
  },
  {
    icon: <AssessmentIcon sx={{ fontSize: 40, color: 'warning.main' }} />, title: 'Reports & Analytics', desc: 'Gain insights with powerful reports and dashboards for smarter business decisions.'
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'linear-gradient(135deg, #f8fafc 0%, #e3f0ff 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Navigation */}
      <Box
        component="header"
        sx={{
          width: '100%',
          px: { xs: 2, md: 8 },
          py: 2,
          bgcolor: 'linear-gradient(90deg, #6ea8fe 0%, #3575d1 100%)',
          boxShadow: 1,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(6px)',
        }}
      >
        <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ letterSpacing: 1 }}>
          Inventory Pro
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 4 } }}>
          <Button color="inherit" sx={{ fontWeight: 500, fontSize: 16, textTransform: 'none' }}>Features</Button>
          <Button color="inherit" sx={{ fontWeight: 500, fontSize: 16, textTransform: 'none' }}>Solution</Button>
          <Button color="inherit" sx={{ fontWeight: 500, fontSize: 16, textTransform: 'none' }}>Pricing</Button>
          <Button color="inherit" sx={{ fontWeight: 500, fontSize: 16, textTransform: 'none' }}>Customer</Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'nowrap' }}>
          <Button variant="outlined" color="primary" onClick={() => navigate('/login')} sx={{ fontWeight: 600, borderRadius: 2 }}>
            Login
          </Button>
          <Button variant="contained" color="secondary" onClick={() => navigate('/register')} sx={{ fontWeight: 600, borderRadius: 2, bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'primary.light', color: 'white' } }}>
            Register
          </Button>
        </Box>
      </Box>
      {/* Hero Section */}
      <Box sx={{
        py: { xs: 6, md: 10 },
        px: 2,
        textAlign: 'center',
        bgcolor: 'rgba(255,255,255,0.98)',
        boxShadow: 1,
        borderRadius: 4,
        mx: { xs: 1, md: 8 },
        mt: 4,
      }}>
        <Typography variant="h2" fontWeight={700} color="primary.main" gutterBottom>
          Inventory Pro
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
          Modern Inventory Management for Growing Businesses
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          Simplify your inventory, sales, purchases, and shipping with a single, powerful platform. Real-time tracking, analytics, and automation to help you scale.
        </Typography>
        <Button variant="contained" size="large" color="primary" onClick={() => navigate('/login')}>
          Inventory Login
        </Button>
      </Box>

      {/* Features Section */}
      <Box sx={{
        flexGrow: 1,
        py: { xs: 4, md: 8 },
        px: { xs: 2, md: 8 },
        maxWidth: 1200,
        mx: 'auto',
        bgcolor: 'rgba(255,255,255,0.92)',
        borderRadius: 4,
        boxShadow: 0,
        mt: 4,
      }}>
        <Typography variant="h4" fontWeight={600} textAlign="center" mb={4}>
          Why Choose Inventory Pro?
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            justifyContent: 'center',
          }}
        >
          {features.map((f) => (
            <Box
              key={f.title}
              sx={{
                flex: {
                  xs: '1 1 100%',
                  sm: '1 1 45%',
                  md: '1 1 22%',
                },
                minWidth: { xs: '100%', sm: 260, md: 220 },
                maxWidth: 320,
                display: 'flex',
              }}
            >
              <Paper elevation={3} sx={{
                p: 3,
                textAlign: 'center',
                height: '100%',
                width: '100%',
                bgcolor: 'rgba(236, 245, 255, 0.7)',
                boxShadow: '0 2px 12px 0 rgba(80,120,200,0.06)',
                borderRadius: 3,
                transition: 'box-shadow 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 24px 0 rgba(80,120,200,0.13)',
                  bgcolor: 'rgba(236, 245, 255, 0.95)',
                },
              }}>
                {f.icon}
                <Typography variant="h6" fontWeight={600} mt={2} mb={1}>{f.title}</Typography>
                <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Call to Action */}
      <Box sx={{
        py: 6,
        textAlign: 'center',
        bgcolor: 'linear-gradient(90deg, #6db3f2 0%, #7ce0c3 100%)',
        color: 'primary.contrastText',
        mt: 6,
        borderRadius: 4,
        mx: { xs: 1, md: 8 },
        boxShadow: 1,
      }}>
        <Typography variant="h5" fontWeight={600} mb={2}>
          Ready to take control of your inventory?
        </Typography>
        <Button variant="contained" size="large" color="secondary" onClick={() => navigate('/login')}>
          Inventory Login
        </Button>
      </Box>

      {/* Customer Testimonial */}
      <Box sx={{
        py: 8,
        textAlign: 'center',
        bgcolor: 'rgba(255,255,255,0.92)',
        borderRadius: 4,
        mx: { xs: 1, md: 8 },
        mt: 4,
        boxShadow: 1,
      }}>
        <Typography variant="h5" fontWeight={600} mb={4} color="text.primary">
          What Our Customers Say
        </Typography>
        <Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
          <Typography variant="h6" fontStyle="italic" color="text.secondary" mb={3}>
            "Inventory Pro transformed our business operations. We reduced stockouts by 90% and improved our efficiency dramatically. The real-time tracking and analytics are game-changers!"
          </Typography>
          <Typography variant="body1" fontWeight={600} color="primary.main">
            Sarah Johnson, CEO at TechFlow Solutions
          </Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          mt: 8,
          py: 6,
          px: { xs: 2, md: 8 },
          bgcolor: 'linear-gradient(90deg, #3575d1 0%, #6ea8fe 100%)',
          borderTop: '1px solid rgba(200, 220, 240, 0.3)',
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 4,
            mb: 4,
          }}>
            {/* Company Info */}
            <Box sx={{ minWidth: 200, flex: 1 }}>
              <Typography variant="h6" fontWeight={700} color="primary.main" mb={2}>
                Inventory Pro
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Modern inventory management solution for growing businesses. Streamline your operations with real-time tracking and analytics.
              </Typography>
            </Box>

            {/* Product Links */}
            <Box sx={{ minWidth: 150, flex: 1 }}>
              <Typography variant="h6" fontWeight={600} color="text.primary" mb={2}>
                Product
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>Features</Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>Pricing</Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>Security</Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>API</Button>
              </Box>
            </Box>

            {/* Company Links */}
            <Box sx={{ minWidth: 150, flex: 1 }}>
              <Typography variant="h6" fontWeight={600} color="text.primary" mb={2}>
                Company
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>About Us</Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>Careers</Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>Blog</Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>Contact</Button>
              </Box>
            </Box>

            {/* Support Links */}
            <Box sx={{ minWidth: 150, flex: 1 }}>
              <Typography variant="h6" fontWeight={600} color="text.primary" mb={2}>
                Support
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>Help Center</Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>Documentation</Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>Community</Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 14 }}>Status</Button>
              </Box>
            </Box>
          </Box>

          {/* Bottom Footer */}
          <Box sx={{
            pt: 4,
            borderTop: '1px solid rgba(200, 220, 240, 0.3)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}>
            <Typography variant="body2" color="text.secondary">
              © 2025 Inventory Pro. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Button color="inherit" sx={{ textTransform: 'none', fontSize: 14 }}>Privacy Policy</Button>
              <Button color="inherit" sx={{ textTransform: 'none', fontSize: 14 }}>Terms of Service</Button>
              <Button color="inherit" sx={{ textTransform: 'none', fontSize: 14 }}>Cookie Policy</Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
