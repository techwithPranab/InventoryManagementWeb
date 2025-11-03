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
  Tooltip,
  InputAdornment,
  TablePagination,
  Fab,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Warehouse as WarehouseIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  SwapHoriz as TransferIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesAPI, productsAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

interface Warehouse {
  _id: string;
  name: string;
  code: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  manager?: {
    _id: string;
    name: string;
    email: string;
  };
  capacity: number;
  currentOccupancy: number;
  occupancyPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  inventoryStats?: {
    totalProducts: number;
    totalQuantity: number;
    totalReserved: number;
  };
}

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
  };
  category: {
    name: string;
  };
  lastRestocked?: string;
  lastSold?: string;
}

interface Transfer {
  _id: string;
  transferNumber: string;
  product: {
    name: string;
    sku: string;
  };
  fromWarehouse: {
    name: string;
    code: string;
  };
  toWarehouse: {
    name: string;
    code: string;
  };
  quantity: number;
  reason: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  transferDate: string;
  completedDate?: string;
  notes?: string;
}

interface WarehouseFormData {
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  capacity: number | string;
}

interface TransferFormData {
  product: string;
  fromWarehouse: string;
  toWarehouse: string;
  quantity: number | string;
  reason: 'restock' | 'relocation' | 'demand' | 'maintenance' | 'other';
  notes: string;
}

const Warehouses: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: '',
    code: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    capacity: '',
  });
  
  const [transferFormData, setTransferFormData] = useState<TransferFormData>({
    product: '',
    fromWarehouse: '',
    toWarehouse: '',
    quantity: '',
    reason: 'restock',
    notes: '',
  });
  
  const [formErrors, setFormErrors] = useState<any>({});

  const queryClient = useQueryClient();

  // Fetch warehouses
  const {
    data: warehouses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['warehouses', { search: searchTerm, page, limit: rowsPerPage }],
    queryFn: async () => {
      const response = await warehousesAPI.getAll({
        search: searchTerm,
        page: page + 1,
        limit: rowsPerPage,
      });
      return response.data;
    },
  });

  // Fetch transfers
  const {
    data: transfers,
  } = useQuery({
    queryKey: ['warehouse-transfers'],
    queryFn: async () => {
      const response = await warehousesAPI.getTransfers({ limit: 50 });
      return response.data;
    },
  });

  // Fetch products for transfer dropdown
  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const response = await productsAPI.getAll({ limit: 1000 });
      return response.data;
    },
  });

  // Fetch inventory for selected warehouse
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
  } = useQuery({
    queryKey: ['warehouse-inventory', selectedWarehouse?._id],
    queryFn: async () => {
      if (!selectedWarehouse) return null;
      const response = await warehousesAPI.getInventory(selectedWarehouse._id);
      return response.data;
    },
    enabled: !!selectedWarehouse && inventoryDialogOpen,
  });

  // Create warehouse mutation
  const createMutation = useMutation({
    mutationFn: (data: WarehouseFormData) => warehousesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      handleCloseDialog();
    },
  });

  // Update warehouse mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WarehouseFormData }) =>
      warehousesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      handleCloseDialog();
    },
  });

  // Delete warehouse mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => warehousesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setDeleteDialogOpen(false);
      setWarehouseToDelete(null);
    },
  });

  // Create transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: (data: TransferFormData) => warehousesAPI.createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
      setTransferDialogOpen(false);
      setTransferFormData({
        product: '',
        fromWarehouse: '',
        toWarehouse: '',
        quantity: '',
        reason: 'restock',
        notes: '',
      });
    },
  });

  // Approve transfer mutation
  const approveTransferMutation = useMutation({
    mutationFn: (id: string) => warehousesAPI.approveTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
    },
  });

  // Complete transfer mutation
  const completeTransferMutation = useMutation({
    mutationFn: (id: string) => warehousesAPI.completeTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
    },
  });

  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        code: warehouse.code,
        address: {
          street: warehouse.address?.street || '',
          city: warehouse.address?.city || '',
          state: warehouse.address?.state || '',
          zipCode: warehouse.address?.zipCode || '',
          country: warehouse.address?.country || '',
        },
        capacity: warehouse.capacity,
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        code: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        capacity: '',
      });
    }
    setFormErrors({});
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingWarehouse(null);
    setFormData({
      name: '',
      code: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      capacity: '',
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: any = {};

    if (!formData.name.trim()) {
      errors.name = 'Warehouse name is required';
    }

    if (!formData.code.trim()) {
      errors.code = 'Warehouse code is required';
    }

    if (formData.capacity && isNaN(Number(formData.capacity))) {
      errors.capacity = 'Capacity must be a number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      capacity: Number(formData.capacity) || 0,
    };

    if (editingWarehouse) {
      updateMutation.mutate({
        id: editingWarehouse._id,
        data: submitData,
      });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDeleteClick = (warehouse: Warehouse) => {
    setWarehouseToDelete(warehouse);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (warehouseToDelete) {
      deleteMutation.mutate(warehouseToDelete._id);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, warehouse: Warehouse) => {
    setAnchorEl(event.currentTarget);
    setSelectedWarehouse(warehouse);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedWarehouse(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateTransfer = () => {
    const submitData = {
      ...transferFormData,
      quantity: Number(transferFormData.quantity),
    };
    createTransferMutation.mutate(submitData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_transit': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading warehouses. Please try again.
      </Alert>
    );
  }

  const filteredWarehouses = warehouses?.warehouses || [];
  const totalCount = warehouses?.total || 0;

  return (
    <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="700" gutterBottom color="#212529">
            Multi-Warehouse Inventory Management
          </Typography>
          <Typography variant="body1" color="#6c757d" fontWeight="500">
            Manage warehouses, inventory, and transfers across multiple locations
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Warehouses" icon={<WarehouseIcon />} />
          <Tab label="Inventory Transfers" icon={<TransferIcon />} />
        </Tabs>
      </Card>

      {activeTab === 0 && (
        <>
          {/* Stats Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, 
            gap: 3, 
            mb: 3 
          }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <WarehouseIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {totalCount}
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      Total Warehouses
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <InventoryIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {filteredWarehouses.reduce((sum: number, wh: Warehouse) => 
                        sum + (wh.inventoryStats?.totalProducts || 0), 0)}
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
                  <TrendingUpIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {Math.round(filteredWarehouses.reduce((sum: number, wh: Warehouse) => 
                        sum + (wh.occupancyPercentage || 0), 0) / (filteredWarehouses.length || 1))}%
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      Avg Occupancy
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TransferIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {transfers?.transfers?.filter((t: Transfer) => t.status === 'pending').length || 0}
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      Pending Transfers
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Search and Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                <TextField
                  placeholder="Search warehouses..."
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
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<TransferIcon />}
                    onClick={() => setTransferDialogOpen(true)}
                  >
                    New Transfer
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Add Warehouse
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Warehouses Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Warehouse</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Manager</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Inventory</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredWarehouses.map((warehouse: Warehouse) => (
                    <TableRow key={warehouse._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <WarehouseIcon color="primary" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {warehouse.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {warehouse.code}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {warehouse.address?.city && warehouse.address?.state
                              ? `${warehouse.address.city}, ${warehouse.address.state}`
                              : 'Not specified'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {warehouse.address?.country || ''}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <PersonIcon color="action" sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {warehouse.manager?.name || 'Not assigned'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {warehouse.currentOccupancy.toLocaleString()} / {warehouse.capacity.toLocaleString()}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={warehouse.occupancyPercentage}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            color={warehouse.occupancyPercentage > 80 ? 'warning' : 'primary'}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {warehouse.occupancyPercentage}% occupied
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {warehouse.inventoryStats?.totalProducts || 0} products
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {(warehouse.inventoryStats?.totalQuantity || 0).toLocaleString()} items
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={warehouse.isActive ? 'Active' : 'Inactive'}
                          color={warehouse.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Inventory">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedWarehouse(warehouse);
                              setInventoryDialogOpen(true);
                            }}
                          >
                            <InventoryIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(warehouse)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, warehouse)}
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
              rowsPerPageOptions={[5, 10, 25]}
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
        <>
          {/* Transfers Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="600">
              Inventory Transfers
            </Typography>
            <Button
              variant="contained"
              startIcon={<TransferIcon />}
              onClick={() => setTransferDialogOpen(true)}
            >
              New Transfer
            </Button>
          </Box>

          {/* Transfers Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Transfer #</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>From → To</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transfers?.transfers?.map((transfer: Transfer) => (
                    <TableRow key={transfer._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {transfer.transferNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {transfer.product?.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            SKU: {transfer.product?.sku}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            <strong>{transfer.fromWarehouse?.name}</strong> ({transfer.fromWarehouse?.code})
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <TransferIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            <strong>{transfer.toWarehouse?.name}</strong> ({transfer.toWarehouse?.code})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {transfer.quantity.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transfer.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(transfer.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(transfer.transferDate)}
                        </Typography>
                        {transfer.completedDate && (
                          <Typography variant="body2" color="textSecondary">
                            Completed: {formatDate(transfer.completedDate)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {transfer.status === 'pending' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => approveTransferMutation.mutate(transfer._id)}
                          >
                            Approve
                          </Button>
                        )}
                        {transfer.status === 'in_transit' && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => completeTransferMutation.mutate(transfer._id)}
                          >
                            Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => activeTab === 0 ? handleOpenDialog() : setTransferDialogOpen(true)}
      >
        {activeTab === 0 ? <AddIcon /> : <TransferIcon />}
      </Fab>

      {/* Add/Edit Warehouse Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Warehouse Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <TextField
                  label="Warehouse Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  error={!!formErrors.code}
                  helperText={formErrors.code}
                  sx={{ flex: 1, minWidth: 200 }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address.street}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  address: { ...formData.address, street: e.target.value }
                })}
              />
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="City"
                  value={formData.address.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, city: e.target.value }
                  })}
                  sx={{ flex: 1, minWidth: 150 }}
                />
                <TextField
                  label="State"
                  value={formData.address.state}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, state: e.target.value }
                  })}
                  sx={{ flex: 1, minWidth: 150 }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="ZIP Code"
                  value={formData.address.zipCode}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, zipCode: e.target.value }
                  })}
                  sx={{ flex: 1, minWidth: 150 }}
                />
                <TextField
                  label="Country"
                  value={formData.address.country}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, country: e.target.value }
                  })}
                  sx={{ flex: 1, minWidth: 150 }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                error={!!formErrors.capacity}
                helperText={formErrors.capacity}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingWarehouse ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Inventory Transfer</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Product</InputLabel>
              <Select
                value={transferFormData.product}
                onChange={(e) => setTransferFormData({ ...transferFormData, product: e.target.value })}
              >
                {products?.products?.map((product: any) => (
                  <MenuItem key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>From Warehouse</InputLabel>
              <Select
                value={transferFormData.fromWarehouse}
                onChange={(e) => setTransferFormData({ ...transferFormData, fromWarehouse: e.target.value })}
              >
                {filteredWarehouses.map((warehouse: Warehouse) => (
                  <MenuItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>To Warehouse</InputLabel>
              <Select
                value={transferFormData.toWarehouse}
                onChange={(e) => setTransferFormData({ ...transferFormData, toWarehouse: e.target.value })}
              >
                {filteredWarehouses
                  .filter((wh: Warehouse) => wh._id !== transferFormData.fromWarehouse)
                  .map((warehouse: Warehouse) => (
                    <MenuItem key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} ({warehouse.code})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={transferFormData.quantity}
              onChange={(e) => setTransferFormData({ ...transferFormData, quantity: e.target.value })}
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Reason</InputLabel>
              <Select
                value={transferFormData.reason}
                onChange={(e) => setTransferFormData({ ...transferFormData, reason: e.target.value as any })}
              >
                <MenuItem value="restock">Restock</MenuItem>
                <MenuItem value="relocation">Relocation</MenuItem>
                <MenuItem value="demand">Demand</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={transferFormData.notes}
              onChange={(e) => setTransferFormData({ ...transferFormData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTransfer}
            variant="contained"
            disabled={createTransferMutation.isPending}
          >
            Create Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Dialog */}
      <Dialog 
        open={inventoryDialogOpen} 
        onClose={() => setInventoryDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          {selectedWarehouse?.name} Inventory
        </DialogTitle>
        <DialogContent>
          {inventoryLoading ? (
            <LoadingSpinner />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Reserved</TableCell>
                    <TableCell>Available</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryData?.inventory?.map((item: InventoryItem) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{item.product.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {item.product.sku}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{item.category.name}</TableCell>
                      <TableCell>{item.quantity.toLocaleString()}</TableCell>
                      <TableCell>{item.reservedQuantity.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.availableQuantity.toLocaleString()}
                          color={item.availableQuantity > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {item.location.aisle || item.location.shelf || item.location.bin
                          ? `${item.location.aisle || ''}-${item.location.shelf || ''}-${item.location.bin || ''}`
                          : 'Not specified'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInventoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Warehouse</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{warehouseToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedWarehouse) handleOpenDialog(selectedWarehouse);
          handleMenuClose();
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedWarehouse) {
            setInventoryDialogOpen(true);
            handleMenuClose();
          }
        }}>
          <InventoryIcon fontSize="small" sx={{ mr: 1 }} />
          View Inventory
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedWarehouse) handleDeleteClick(selectedWarehouse);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Warehouses;
