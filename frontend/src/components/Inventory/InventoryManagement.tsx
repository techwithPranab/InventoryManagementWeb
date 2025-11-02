import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Menu,
  MenuItem,
  InputAdornment,
  TablePagination,
  Fab,
  FormControl,
  InputLabel,
  Select,

  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Avatar,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  SwapVert as AdjustmentIcon,
  History as HistoryIcon,
  AttachMoney as MoneyIcon,
  Warehouse as WarehouseIcon,
  Category as CategoryIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryAPI, warehousesAPI, productsAPI, categoriesAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

interface InventoryItem {
  _id: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  location: {
    aisle?: string;
    shelf?: string;
    bin?: string;
  };
  product: {
    _id: string;
    name: string;
    sku: string;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    reorderLevel: number;
    minStockLevel: number;
  };
  category: {
    _id: string;
    name: string;
  };
  warehouse: {
    _id: string;
    name: string;
    code: string;
  };
  totalValue: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  lastRestocked?: string;
  lastSold?: string;
}

interface InventoryAlert {
  _id: string;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock';
  severity: 'critical' | 'high' | 'medium';
  quantity: number;
  product: any;
  warehouse: any;
}

interface MovementRecord {
  type: string;
  date: string;
  product: any;
  warehouse: any;
  relatedWarehouse?: any;
  quantity: number;
  reference: string;
  status: string;
  user: any;
}

interface AdjustmentFormData {
  warehouse: string;
  product: string;
  adjustmentType: 'increase' | 'decrease' | 'set';
  quantity: number | string;
  reason: 'recount' | 'damage' | 'theft' | 'expiry' | 'found' | 'correction' | 'other';
  notes: string;
}

interface AddInventoryFormData {
  warehouse: string;
  product: string;
  quantity: number | string;
  location: {
    aisle: string;
    shelf: string;
    bin: string;
  };
  notes: string;
}

interface EditInventoryFormData {
  quantity: number | string;
  location: {
    aisle: string;
    shelf: string;
    bin: string;
  };
  notes: string;
}

const InventoryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [addInventoryDialogOpen, setAddInventoryDialogOpen] = useState(false);
  const [editInventoryDialogOpen, setEditInventoryDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy] = useState('product.name');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const [adjustmentFormData, setAdjustmentFormData] = useState<AdjustmentFormData>({
    warehouse: '',
    product: '',
    adjustmentType: 'increase',
    quantity: '',
    reason: 'correction',
    notes: '',
  });

  const [addInventoryFormData, setAddInventoryFormData] = useState<AddInventoryFormData>({
    warehouse: '',
    product: '',
    quantity: '',
    location: {
      aisle: '',
      shelf: '',
      bin: ''
    },
    notes: '',
  });

  const [editInventoryFormData, setEditInventoryFormData] = useState<EditInventoryFormData>({
    quantity: '',
    location: {
      aisle: '',
      shelf: '',
      bin: ''
    },
    notes: '',
  });

  const queryClient = useQueryClient();

  // Fetch inventory data
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useQuery({
    queryKey: ['inventory', { 
      search: searchTerm, 
      warehouse: selectedWarehouse,
      category: selectedCategory,
      lowStock: stockFilter === 'low',
      outOfStock: stockFilter === 'out',
      page: page + 1, 
      limit: rowsPerPage,
      sortBy,
      sortOrder
    }],
    queryFn: async () => {
      const response = await inventoryAPI.getAll({
        search: searchTerm,
        warehouse: selectedWarehouse || undefined,
        category: selectedCategory || undefined,
        lowStock: stockFilter === 'low',
        outOfStock: stockFilter === 'out',
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder
      });
      return response.data;
    },
  });

  // Fetch inventory summary
  const { data: summaryData } = useQuery({
    queryKey: ['inventory-summary', selectedWarehouse],
    queryFn: async () => {
      const response = await inventoryAPI.getSummary({
        warehouse: selectedWarehouse || undefined
      });
      return response.data;
    },
  });

  // Fetch alerts
  const { data: alertsData } = useQuery({
    queryKey: ['inventory-alerts', selectedWarehouse],
    queryFn: async () => {
      const response = await inventoryAPI.getAlerts({
        warehouse: selectedWarehouse || undefined
      });
      return response.data;
    },
  });

  // Fetch movements
  const { data: movementsData } = useQuery({
    queryKey: ['inventory-movements', selectedWarehouse],
    queryFn: async () => {
      const response = await inventoryAPI.getMovements({
        warehouse: selectedWarehouse || undefined,
        limit: 20
      });
      return response.data;
    },
    enabled: activeTab === 2,
  });

  // Fetch valuation
  const { data: valuationData } = useQuery({
    queryKey: ['inventory-valuation', selectedWarehouse],
    queryFn: async () => {
      const response = await inventoryAPI.getValuation({
        warehouse: selectedWarehouse || undefined,
        method: 'cost'
      });
      return response.data;
    },
    enabled: activeTab === 3,
  });

  // Fetch warehouses for filters
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-all'],
    queryFn: async () => {
      const response = await warehousesAPI.getAll({ limit: 100 });
      return response.data;
    },
  });

  // Fetch categories for filters
  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll({ limit: 100 });
      return response.data;
    },
  });

  // Fetch products for adjustment
  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const response = await productsAPI.getAll({ limit: 1000 });
      return response.data;
    },
  });

  // Fetch item history
  const { data: itemHistoryData, isLoading: historyLoading } = useQuery({
    queryKey: ['inventory-item-history', selectedItem?._id],
    queryFn: async () => {
      if (!selectedItem) return { movements: [] };
      const response = await inventoryAPI.getMovements({
        warehouse: selectedItem.warehouse._id,
        product: selectedItem.product._id,
        limit: 50
      });
      return response.data;
    },
    enabled: historyDialogOpen && !!selectedItem,
  });

  // Create adjustment mutation
  const createAdjustmentMutation = useMutation({
    mutationFn: (data: AdjustmentFormData) => inventoryAPI.createAdjustment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
      setAdjustmentDialogOpen(false);
      setAdjustmentFormData({
        warehouse: '',
        product: '',
        adjustmentType: 'increase',
        quantity: '',
        reason: 'correction',
        notes: '',
      });
    },
  });

  // Add inventory mutation
  const addInventoryMutation = useMutation({
    mutationFn: (data: AddInventoryFormData) => {
      const payload = {
        warehouse: data.warehouse,
        product: data.product,
        adjustmentType: 'set' as const,
        quantity: Number(data.quantity),
        reason: 'correction' as const,
        notes: data.notes || 'Initial inventory entry',
        location: data.location
      };
      return inventoryAPI.createAdjustment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
      setAddInventoryDialogOpen(false);
      setAddInventoryFormData({
        warehouse: '',
        product: '',
        quantity: '',
        location: { aisle: '', shelf: '', bin: '' },
        notes: '',
      });
    },
  });

  // Edit inventory mutation
  const editInventoryMutation = useMutation({
    mutationFn: (data: EditInventoryFormData & { warehouse: string; product: string }) => {
      const payload = {
        warehouse: data.warehouse,
        product: data.product,
        adjustmentType: 'set' as const,
        quantity: Number(data.quantity),
        reason: 'correction' as const,
        notes: data.notes || 'Inventory update',
        location: data.location
      };
      return inventoryAPI.createAdjustment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
      setEditInventoryDialogOpen(false);
      setEditInventoryFormData({
        quantity: '',
        location: { aisle: '', shelf: '', bin: '' },
        notes: '',
      });
      setSelectedItem(null);
    },
  });

  const handleAdjustmentSubmit = () => {
    const submitData = {
      ...adjustmentFormData,
      quantity: Number(adjustmentFormData.quantity),
    };
    createAdjustmentMutation.mutate(submitData);
  };

  const handleAddInventorySubmit = () => {
    const submitData = {
      ...addInventoryFormData,
      quantity: Number(addInventoryFormData.quantity),
    };
    addInventoryMutation.mutate(submitData);
  };

  const handleEditInventorySubmit = () => {
    if (!selectedItem) return;
    
    const submitData = {
      ...editInventoryFormData,
      warehouse: selectedItem.warehouse._id,
      product: selectedItem.product._id,
      quantity: Number(editInventoryFormData.quantity),
    };
    editInventoryMutation.mutate(submitData);
  };

  const handleEditInventoryOpen = (item: InventoryItem) => {
    if (!item) {
      console.error('No item provided to handleEditInventoryOpen');
      return;
    }
    
    setSelectedItem(item);
    
    const formData = {
      quantity: item.quantity.toString(),
      location: {
        aisle: item.location?.aisle || '',
        shelf: item.location?.shelf || '',
        bin: item.location?.bin || ''
      },
      notes: '',
    };
    
    setEditInventoryFormData(formData);
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      setEditInventoryDialogOpen(true);
    }, 100);
  };

  const handleViewHistoryOpen = (item: InventoryItem) => {
    setSelectedItem(item);
    setHistoryDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditInventoryDialogOpen(false);
    setSelectedItem(null);
    setEditInventoryFormData({
      quantity: '',
      location: { aisle: '', shelf: '', bin: '' },
      notes: '',
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: InventoryItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selectedItem here - let individual handlers manage it
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'out_of_stock': return <ErrorIcon />;
      case 'low_stock': return <WarningIcon />;
      case 'overstock': return <TrendingUpIcon />;
      default: return <WarningIcon />;
    }
  };

  if (inventoryLoading) return <LoadingSpinner />;

  if (inventoryError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading inventory data. Please try again.
      </Alert>
    );
  }

  const inventory = inventoryData?.inventory || [];
  const totalCount = inventoryData?.total || 0;
  const summary = summaryData?.summary || {};
  const alerts = alertsData?.alerts || [];
  const movements = movementsData?.movements || [];
  const valuation = valuationData?.totals || {};

  return (
    <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="700" gutterBottom color="#212529">
            Inventory Management System
          </Typography>
          <Typography variant="body1" color="#6c757d" fontWeight="500">
            Comprehensive inventory tracking, analytics, and management across all locations
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<InventoryIcon />}
            onClick={() => setAddInventoryDialogOpen(true)}
            sx={{ backgroundColor: '#28a745', '&:hover': { backgroundColor: '#218838' } }}
          >
            Add Inventory
          </Button>
          <Button
            variant="outlined"
            startIcon={<AdjustmentIcon />}
            onClick={() => setAdjustmentDialogOpen(true)}
          >
            Stock Adjustment
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['inventory'] })}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, 
        gap: 3, 
        mb: 3 
      }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <InventoryIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {summary.totalProducts?.toLocaleString() || 0}
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  Total Products
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <CheckCircleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {summary.totalQuantity?.toLocaleString() || 0}
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  Total Stock
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <MoneyIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(summary.totalValue || 0)}
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  Total Value
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <WarningIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {summary.lowStockItems || 0}
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  Low Stock Items
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <ErrorIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {summary.outOfStockItems || 0}
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  Out of Stock
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Inventory Overview" icon={<InventoryIcon />} />
          <Tab label="Stock Alerts" icon={<Badge badgeContent={alerts.length} color="error"><WarningIcon /></Badge>} />
          <Tab label="Stock Movements" icon={<HistoryIcon />} />
          <Tab label="Inventory Valuation" icon={<MoneyIcon />} />
        </Tabs>
      </Card>

      {activeTab === 0 && (
        <>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                <TextField
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ minWidth: 300 }}
                />
                
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Warehouse</InputLabel>
                  <Select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                  >
                    <MenuItem value="">All Warehouses</MenuItem>
                    {warehouses?.warehouses?.map((warehouse: any) => (
                      <MenuItem key={warehouse._id} value={warehouse._id}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories?.categories?.map((category: any) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <ToggleButtonGroup
                  value={stockFilter}
                  exclusive
                  onChange={(e, newFilter) => newFilter && setStockFilter(newFilter)}
                  size="small"
                >
                  <ToggleButton value="all">All</ToggleButton>
                  <ToggleButton value="low">Low Stock</ToggleButton>
                  <ToggleButton value="out">Out of Stock</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell>Stock Levels</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item: InventoryItem) => (
                    <TableRow key={item._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {item.product.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            SKU: {item.product.sku}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.category.name}
                          size="small"
                          icon={<CategoryIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <WarehouseIcon color="action" sx={{ mr: 1, fontSize: 16 }} />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {item.warehouse.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {item.warehouse.code}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            <strong>Total:</strong> {item.quantity.toLocaleString()} {item.product.unit}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Available:</strong> {item.availableQuantity.toLocaleString()} {item.product.unit}
                          </Typography>
                          {item.reservedQuantity > 0 && (
                            <Typography variant="body2" color="warning.main">
                              <strong>Reserved:</strong> {item.reservedQuantity.toLocaleString()} {item.product.unit}
                            </Typography>
                          )}
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((item.quantity / item.product.reorderLevel) * 100, 100)}
                            sx={{ mt: 1, height: 4, borderRadius: 2 }}
                            color={item.isLowStock ? 'warning' : 'success'}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {item.location?.aisle || item.location?.shelf || item.location?.bin
                          ? `${item.location.aisle || ''}-${item.location.shelf || ''}-${item.location.bin || ''}`
                          : 'Not specified'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(item.totalValue)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          @ {formatCurrency(item.product.costPrice)}/{item.product.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={1}>
                          {item.isOutOfStock && (
                            <Chip
                              label="Out of Stock"
                              color="error"
                              size="small"
                              icon={<ErrorIcon />}
                            />
                          )}
                          {!item.isOutOfStock && item.isLowStock && (
                            <Chip
                              label="Low Stock"
                              color="warning"
                              size="small"
                              icon={<WarningIcon />}
                            />
                          )}
                          {!item.isOutOfStock && !item.isLowStock && (
                            <Chip
                              label="In Stock"
                              color="success"
                              size="small"
                              icon={<CheckCircleIcon />}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, item)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Card>
        </>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stock Alerts
            </Typography>
            {alerts.length === 0 ? (
              <Alert severity="success">
                No stock alerts at this time. All inventory levels are healthy!
              </Alert>
            ) : (
              <List>
                {alerts.map((alert: InventoryAlert) => (
                  <ListItem key={alert._id}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: `${getSeverityColor(alert.severity)}.main` }}>
                        {getAlertIcon(alert.alertType)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {alert.product?.name}
                          </Typography>
                          <Chip
                            label={alert.alertType.replace('_', ' ').toUpperCase()}
                            color={getSeverityColor(alert.severity) as any}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary">
                          {alert.warehouse?.name} • Current Stock: {alert.quantity} • 
                          SKU: {alert.product?.sku}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Stock Movements
            </Typography>
            {movements.length === 0 ? (
              <Alert severity="info">
                No recent stock movements found.
              </Alert>
            ) : (
              <List>
                {movements.map((movement: MovementRecord, index: number) => (
                  <ListItem key={`${movement.reference}-${movement.date}-${index}`}>
                    <ListItemIcon>
                      <Avatar sx={{ 
                        bgcolor: movement.quantity > 0 ? 'success.main' : 'error.main' 
                      }}>
                        {movement.quantity > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {movement.product?.name}
                          </Typography>
                          <Chip
                            label={`${movement.quantity > 0 ? '+' : ''}${movement.quantity}`}
                            color={movement.quantity > 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary">
                          {movement.warehouse?.name} • {formatDate(movement.date)} • 
                          Ref: {movement.reference} • By: {movement.user?.name}
                          {movement.relatedWarehouse && ` • From/To: ${movement.relatedWarehouse.name}`}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
          gap: 3 
        }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Valuation
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {formatCurrency(valuation.totalValue || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Based on cost price
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Value
              </Typography>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                {formatCurrency(valuation.availableValue || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Excluding reserved stock
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reserved Value
              </Typography>
              <Typography variant="h5" color="warning.main" fontWeight="bold">
                {formatCurrency(valuation.reservedValue || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Reserved for orders
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add inventory"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setAddInventoryDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onClose={() => setAdjustmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Stock Adjustment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Warehouse</InputLabel>
              <Select
                value={adjustmentFormData.warehouse}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, warehouse: e.target.value })}
              >
                {warehouses?.warehouses?.map((warehouse: any) => (
                  <MenuItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Product</InputLabel>
              <Select
                value={adjustmentFormData.product}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, product: e.target.value })}
              >
                {products?.products?.map((product: any) => (
                  <MenuItem key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Adjustment Type</InputLabel>
              <Select
                value={adjustmentFormData.adjustmentType}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, adjustmentType: e.target.value as any })}
              >
                <MenuItem value="increase">Increase Stock</MenuItem>
                <MenuItem value="decrease">Decrease Stock</MenuItem>
                <MenuItem value="set">Set Stock Level</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={adjustmentFormData.quantity}
              onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, quantity: e.target.value })}
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Reason</InputLabel>
              <Select
                value={adjustmentFormData.reason}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, reason: e.target.value as any })}
              >
                <MenuItem value="recount">Stock Recount</MenuItem>
                <MenuItem value="damage">Damaged Goods</MenuItem>
                <MenuItem value="theft">Theft/Loss</MenuItem>
                <MenuItem value="expiry">Expired Items</MenuItem>
                <MenuItem value="found">Found Inventory</MenuItem>
                <MenuItem value="correction">System Correction</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={adjustmentFormData.notes}
              onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustmentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAdjustmentSubmit}
            variant="contained"
            disabled={createAdjustmentMutation.isPending}
          >
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Inventory Dialog */}
      <Dialog open={addInventoryDialogOpen} onClose={() => setAddInventoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Inventory Item</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Warehouse *</InputLabel>
              <Select
                value={addInventoryFormData.warehouse}
                onChange={(e) => setAddInventoryFormData({ ...addInventoryFormData, warehouse: e.target.value })}
                required
              >
                {warehouses?.warehouses?.map((warehouse: any) => (
                  <MenuItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Product *</InputLabel>
              <Select
                value={addInventoryFormData.product}
                onChange={(e) => setAddInventoryFormData({ ...addInventoryFormData, product: e.target.value })}
                required
              >
                {products?.products?.map((product: any) => (
                  <MenuItem key={product._id} value={product._id}>
                    {product.name} ({product.sku}) - {product.unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Initial Quantity *"
              type="number"
              value={addInventoryFormData.quantity}
              onChange={(e) => setAddInventoryFormData({ ...addInventoryFormData, quantity: e.target.value })}
              sx={{ mb: 3 }}
              required
              slotProps={{ 
                htmlInput: { min: 0 }
              }}
            />

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1 }}>
              Storage Location (Optional)
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
              <TextField
                label="Aisle"
                value={addInventoryFormData.location.aisle}
                onChange={(e) => setAddInventoryFormData({ 
                  ...addInventoryFormData, 
                  location: { ...addInventoryFormData.location, aisle: e.target.value }
                })}
              />
              <TextField
                label="Shelf"
                value={addInventoryFormData.location.shelf}
                onChange={(e) => setAddInventoryFormData({ 
                  ...addInventoryFormData, 
                  location: { ...addInventoryFormData.location, shelf: e.target.value }
                })}
              />
              <TextField
                label="Bin"
                value={addInventoryFormData.location.bin}
                onChange={(e) => setAddInventoryFormData({ 
                  ...addInventoryFormData, 
                  location: { ...addInventoryFormData.location, bin: e.target.value }
                })}
              />
            </Box>

            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={addInventoryFormData.notes}
              onChange={(e) => setAddInventoryFormData({ ...addInventoryFormData, notes: e.target.value })}
              placeholder="Optional notes about this inventory item..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddInventoryDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddInventorySubmit}
            variant="contained"
            disabled={addInventoryMutation.isPending || !addInventoryFormData.warehouse || !addInventoryFormData.product || !addInventoryFormData.quantity}
          >
            Add Inventory
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Inventory Dialog */}
      <Dialog 
        open={editInventoryDialogOpen} 
        onClose={handleEditDialogClose} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Edit Inventory{selectedItem ? ` - ${selectedItem.product.name}` : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedItem ? (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Product:</strong> {selectedItem.product.name} ({selectedItem.product.sku}) <br/>
                    <strong>Warehouse:</strong> {selectedItem.warehouse.name} ({selectedItem.warehouse.code}) <br/>
                    <strong>Current Stock:</strong> {selectedItem.quantity} {selectedItem.product.unit} <br/>
                    <strong>Available:</strong> {selectedItem.availableQuantity} {selectedItem.product.unit} <br/>
                    <strong>Reserved:</strong> {selectedItem.reservedQuantity} {selectedItem.product.unit}
                  </Typography>
                </Alert>

                <TextField
                  fullWidth
                  label="New Quantity *"
                  type="number"
                  value={editInventoryFormData.quantity}
                  onChange={(e) => setEditInventoryFormData({ ...editInventoryFormData, quantity: e.target.value })}
                  sx={{ mb: 3 }}
                  required
                  slotProps={{ 
                    htmlInput: { min: 0 }
                  }}
                  helperText={`Current quantity: ${selectedItem.quantity} ${selectedItem.product.unit}`}
                />

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1 }}>
                  Storage Location
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
                  <TextField
                    label="Aisle"
                    value={editInventoryFormData.location.aisle}
                    onChange={(e) => setEditInventoryFormData({ 
                      ...editInventoryFormData, 
                      location: { ...editInventoryFormData.location, aisle: e.target.value }
                    })}
                    placeholder={selectedItem.location?.aisle || 'Not set'}
                  />
                  <TextField
                    label="Shelf"
                    value={editInventoryFormData.location.shelf}
                    onChange={(e) => setEditInventoryFormData({ 
                      ...editInventoryFormData, 
                      location: { ...editInventoryFormData.location, shelf: e.target.value }
                    })}
                    placeholder={selectedItem.location?.shelf || 'Not set'}
                  />
                  <TextField
                    label="Bin"
                    value={editInventoryFormData.location.bin}
                    onChange={(e) => setEditInventoryFormData({ 
                      ...editInventoryFormData, 
                      location: { ...editInventoryFormData.location, bin: e.target.value }
                    })}
                    placeholder={selectedItem.location?.bin || 'Not set'}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Update Notes"
                  multiline
                  rows={3}
                  value={editInventoryFormData.notes}
                  onChange={(e) => setEditInventoryFormData({ ...editInventoryFormData, notes: e.target.value })}
                  placeholder="Reason for inventory update..."
                />
              </>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Loading inventory item data...
                </Alert>
                <Typography variant="body2" color="textSecondary">
                  If this message persists, please close the dialog and try again.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button
            onClick={handleEditInventorySubmit}
            variant="contained"
            disabled={editInventoryMutation.isPending || !editInventoryFormData.quantity || !selectedItem}
          >
            Update Inventory
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Inventory History - {selectedItem?.product.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedItem && (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Product:</strong> {selectedItem.product.name} ({selectedItem.product.sku}) <br/>
                    <strong>Warehouse:</strong> {selectedItem.warehouse.name} ({selectedItem.warehouse.code}) <br/>
                    <strong>Current Stock:</strong> {selectedItem.quantity} {selectedItem.product.unit}
                  </Typography>
                </Alert>

                {historyLoading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <LoadingSpinner />
                  </Box>
                ) : (
                  <>
                    {itemHistoryData?.movements?.length === 0 ? (
                      <Alert severity="info">
                        No movement history found for this inventory item.
                      </Alert>
                    ) : (
                      <List>
                        {itemHistoryData?.movements?.map((movement: MovementRecord, index: number) => (
                          <ListItem key={`${movement.reference}-${movement.date}-${index}`} divider>
                            <ListItemIcon>
                              <Avatar sx={{ 
                                bgcolor: movement.quantity > 0 ? 'success.main' : 'error.main',
                                width: 40,
                                height: 40
                              }}>
                                {movement.quantity > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {movement.type.replace('_', ' ').toUpperCase()}
                                  </Typography>
                                  <Chip
                                    label={`${movement.quantity > 0 ? '+' : ''}${movement.quantity} ${selectedItem.product.unit}`}
                                    color={movement.quantity > 0 ? 'success' : 'error'}
                                    size="small"
                                  />
                                  <Chip
                                    label={movement.status.toUpperCase()}
                                    color={movement.status === 'completed' ? 'success' : 'warning'}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="textSecondary">
                                    <strong>Date:</strong> {formatDate(movement.date)} <br/>
                                    <strong>Reference:</strong> {movement.reference} <br/>
                                    <strong>User:</strong> {movement.user?.name || 'System'} <br/>
                                    {movement.relatedWarehouse && (
                                      <>
                                        <strong>{movement.quantity > 0 ? 'From' : 'To'}:</strong> {movement.relatedWarehouse.name} <br/>
                                      </>
                                    )}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const itemToEdit = selectedItem;
          handleMenuClose();
          if (itemToEdit) {
            handleEditInventoryOpen(itemToEdit);
          }
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Inventory
        </MenuItem>
        <MenuItem onClick={() => {
          const itemToAdjust = selectedItem;
          handleMenuClose();
          if (itemToAdjust) {
            setAdjustmentFormData({
              ...adjustmentFormData,
              warehouse: itemToAdjust.warehouse._id,
              product: itemToAdjust.product._id,
            });
            setAdjustmentDialogOpen(true);
          }
        }}>
          <AdjustmentIcon fontSize="small" sx={{ mr: 1 }} />
          Adjust Stock
        </MenuItem>
        <MenuItem onClick={() => {
          const itemToView = selectedItem;
          handleMenuClose();
          if (itemToView) {
            handleViewHistoryOpen(itemToView);
          }
        }}>
          <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
          View History
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default InventoryManagement;
