import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Inventory,
  Warning,
  CheckCircle,
  MonetizationOn,
  Assignment,
  Refresh,
  MoreVert,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

interface OverviewCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const OverviewCard: React.FC<OverviewCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle, 
  trend 
}) => {
  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography color="textSecondary" variant="body2" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                {trend.isPositive ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography 
                  variant="body2" 
                  color={trend.isPositive ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend.value)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ 
            color: `${color}.main`, 
            backgroundColor: `${color}.light`,
            borderRadius: 2,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const response = await dashboardAPI.getOverview();
      return response.data;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const {
    data: inventoryAlerts,
    isLoading: alertsLoading,
    error: alertsError,
  } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      const response = await dashboardAPI.getInventoryAlerts();
      return response.data;
    },
  });

  const {
    data: recentActivities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const response = await dashboardAPI.getRecentActivities(10);
      return response.data;
    },
  });

  const {
    data: topProducts,
    isLoading: topProductsLoading,
    error: topProductsError,
  } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      const response = await dashboardAPI.getTopProducts('month');
      return response.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRefresh = () => {
    refetchOverview();
  };

  if (overviewLoading || alertsLoading || activitiesLoading || topProductsLoading) {
    return <LoadingSpinner />;
  }

  if (overviewError || alertsError || activitiesError || topProductsError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading dashboard data. Please try refreshing the page.
      </Alert>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Welcome back! Here's what's happening with your inventory.
          </Typography>
        </Box>
        <Tooltip title="Refresh Dashboard">
          <IconButton onClick={handleRefresh} size="large">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Overview Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}>
        <OverviewCard
          title="Total Products"
          value={overview?.overview?.totalProducts || 0}
          icon={<Inventory />}
          color="primary"
          subtitle="Active inventory items"
        />
        <OverviewCard
          title="Total Revenue"
          value={formatCurrency(overview?.overview?.totalRevenue || 0)}
          icon={<MonetizationOn />}
          color="success"
          subtitle="Last 30 days"
        />
        <OverviewCard
          title="Total Orders"
          value={(overview?.overview?.totalPurchaseOrders || 0) + (overview?.overview?.totalSalesOrders || 0)}
          icon={<Assignment />}
          color="warning"
          subtitle="Purchase + Sales"
        />
        <OverviewCard
          title="Low Stock Items"
          value={overview?.overview?.lowStockCount || 0}
          icon={<Warning />}
          color="error"
          subtitle="Need attention"
        />
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Inventory Alerts */}
        <Card sx={{ height: 'fit-content' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Inventory Alerts
              </Typography>
              <Chip 
                label={`${inventoryAlerts?.alerts?.length || 0} alerts`} 
                color={inventoryAlerts?.alerts && inventoryAlerts.alerts.length > 0 ? 'warning' : 'success'}
                size="small"
              />
            </Box>
            
            {inventoryAlerts?.alerts && inventoryAlerts.alerts.length > 0 ? (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {inventoryAlerts.alerts.map((alert: any, index: number) => (
                  <ListItem key={alert._id || index} divider>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${alert.product?.name} (${alert.product?.sku})`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {alert.alertType === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'} - Current: {alert.currentQuantity}, Reorder at: {alert.product?.reorderLevel}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Warehouse: {alert.warehouse?.name} ({alert.warehouse?.code})
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                py={4}
              >
                <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" color="success.main" gutterBottom>
                  All good!
                </Typography>
                <Typography variant="body2" color="textSecondary" textAlign="center">
                  No inventory alerts at this time.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card sx={{ height: 'fit-content' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Recent Activities
              </Typography>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Box>
            
            {recentActivities?.activities && recentActivities.activities.length > 0 ? (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {recentActivities.activities.map((activity: any, index: number) => (
                  <ListItem key={activity._id || index} divider>
                    <ListItemIcon>
                      <Assignment color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${activity.type === 'purchase' ? 'Purchase' : 'Sale'} Order: ${activity.orderNumber}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {activity.party} - {formatCurrency(activity.amount)} - {activity.status}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {activity.warehouse && `Warehouse: ${activity.warehouse} - `}{formatDate(activity.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                py={4}
              >
                <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No recent activities
                </Typography>
                <Typography variant="body2" color="textSecondary" textAlign="center">
                  Activities will appear here as you use the system.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top Performing Products
              </Typography>
              
              {topProducts?.topProducts && topProducts.topProducts.length > 0 ? (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, 
                  gap: 2 
                }}>
                  {topProducts.topProducts.map((product: any, index: number) => (
                    <Paper 
                      key={product._id || index} 
                      sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          #{index + 1}
                        </Typography>
                        {product.category && (
                          <Chip 
                            label={product.category.name || product.category} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {product.product?.name || 'Product'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        SKU: {product.product?.sku}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="textSecondary">
                          Sales
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {product.totalQuantitySold || 0}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          Revenue
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatCurrency(product.totalRevenue || 0)}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center" 
                  py={4}
                >
                  <TrendingUp sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No sales data available
                  </Typography>
                  <Typography variant="body2" color="textSecondary" textAlign="center">
                    Product performance will appear here once you have sales data.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
