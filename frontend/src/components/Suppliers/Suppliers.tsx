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
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  LocalShipping as SupplierIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SupplierFormData {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes: string;
}

const Suppliers: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
    },
    notes: '',
  });

  const queryClient = useQueryClient();

  const {
    data: suppliers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['suppliers', { search: searchTerm, page: page + 1, limit: rowsPerPage }],
    queryFn: async () => {
      const response = await suppliersAPI.getAll({
        search: searchTerm,
        page: page + 1,
        limit: rowsPerPage,
      });
      console.log('Suppliers API Response:', response.data);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: SupplierFormData) => suppliersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierFormData }) =>
      suppliersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      setEditingSupplier(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
      },
      notes: '',
    });
  };

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        website: supplier.website,
        address: supplier.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India',
        },
        notes: supplier.notes,
      });
    } else {
      setEditingSupplier(null);
      resetForm();
    }
    setOpen(true);
  };

  const handleSubmit = () => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (supplierToDelete) {
      deleteMutation.mutate(supplierToDelete._id);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, supplier: Supplier) => {
    setAnchorEl(event.currentTarget);
    setSelectedSupplier(supplier);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSupplier(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading suppliers. Please try again.
      </Alert>
    );
  }

  const suppliersList = suppliers?.suppliers || [];
  const totalCount = suppliers?.total || 0;

  return (
    <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="700" gutterBottom color="#212529">
            Supplier Management
          </Typography>
          <Typography variant="body1" color="#6c757d" fontWeight="500">
            Manage your supplier and vendor relationships
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, 
        gap: 2, 
        mb: 3 
      }}>
        <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid #e9ecef' }}>
          <CardContent sx={{ py: 2 }}>
            <Box display="flex" alignItems="center">
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: '#495057', 
                color: 'white',
                mr: 2 
              }}>
                <SupplierIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="600" color="#212529">
                  {totalCount}
                </Typography>
                <Typography color="#6c757d" variant="body2" fontWeight="500">
                  Total Suppliers
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid #e9ecef' }}>
          <CardContent sx={{ py: 2 }}>
            <Box display="flex" alignItems="center">
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: '#28a745', 
                color: 'white',
                mr: 2 
              }}>
                <CheckCircleIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="600" color="#212529">
                  {suppliersList.filter((s: Supplier) => s.isActive !== false).length}
                </Typography>
                <Typography color="#6c757d" variant="body2" fontWeight="500">
                  Active Suppliers
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid #e9ecef' }}>
          <CardContent sx={{ py: 2 }}>
            <Box display="flex" alignItems="center">
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: '#17a2b8', 
                color: 'white',
                mr: 2 
              }}>
                <EmailIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="600" color="#212529">
                  {suppliersList.filter((s: Supplier) => s.email).length}
                </Typography>
                <Typography color="#6c757d" variant="body2" fontWeight="500">
                  With Email
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid #e9ecef' }}>
          <CardContent sx={{ py: 2 }}>
            <Box display="flex" alignItems="center">
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: '#6f42c1', 
                color: 'white',
                mr: 2 
              }}>
                <WebsiteIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="600" color="#212529">
                  {suppliersList.filter((s: Supplier) => s.website).length}
                </Typography>
                <Typography color="#6c757d" variant="body2" fontWeight="500">
                  With Website
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, bgcolor: '#ffffff', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ py: 2.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#6c757d' }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ 
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#f8f9fa',
                    '& fieldset': { borderColor: '#dee2e6' },
                    '&:hover fieldset': { borderColor: '#495057' },
                    '&.Mui-focused fieldset': { borderColor: '#495057' }
                  }
                }}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: '#495057',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1,
                '&:hover': {
                  bgcolor: '#343a40'
                }
              }}
            >
              Add Supplier
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card sx={{ bgcolor: '#ffffff', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Contact Person</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Website</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Created</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliersList.map((supplier: Supplier) => (
                <TableRow key={supplier._id} hover sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: '#495057', width: 36, height: 36 }}>
                        <Typography variant="body2" fontWeight="600">
                          {supplier.name.charAt(0).toUpperCase()}
                        </Typography>
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600" color="#212529">
                          {supplier.name}
                        </Typography>
                        {supplier.notes && (
                          <Typography variant="body2" color="#6c757d">
                            {supplier.notes.substring(0, 50)}...
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Typography variant="body2" color="#495057" fontWeight="500">
                      {supplier.contactPerson || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Typography variant="body2" color="#495057">
                      {supplier.phone || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    {supplier.email ? (
                      <Typography variant="body2" color="#17a2b8">
                        {supplier.email}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="#6c757d">N/A</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    {supplier.address ? (
                      <Box>
                        <Typography variant="body2" color="#495057">
                          {supplier.address.city}, {supplier.address.state}
                        </Typography>
                        <Typography variant="body2" color="#6c757d">
                          {supplier.address.country}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="#6c757d">N/A</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    {supplier.website ? (
                      <Typography variant="body2" color="#17a2b8">
                        {supplier.website}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="#6c757d">N/A</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Typography variant="body2" color="#6c757d">
                      {formatDate(supplier.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Tooltip title="More actions">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, supplier)}
                        sx={{ color: '#6c757d' }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add supplier"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Supplier Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <TextField
                label="Contact Person"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <TextField
                label="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </Box>
            
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Address Information
            </Typography>
            <TextField
              fullWidth
              label="Street Address"
              value={formData.address.street}
              onChange={(e) => setFormData({ 
                ...formData, 
                address: { ...formData.address, street: e.target.value }
              })}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
              <TextField
                label="City"
                value={formData.address.city}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  address: { ...formData.address, city: e.target.value }
                })}
              />
              <TextField
                label="State"
                value={formData.address.state}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  address: { ...formData.address, state: e.target.value }
                })}
              />
              <TextField
                label="ZIP Code"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  address: { ...formData.address, zipCode: e.target.value }
                })}
              />
            </Box>
            <TextField
              fullWidth
              label="Country"
              value={formData.address.country}
              onChange={(e) => setFormData({ 
                ...formData, 
                address: { ...formData.address, country: e.target.value }
              })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this supplier..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending || !formData.name}
          >
            {editingSupplier ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Supplier</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{supplierToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
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
          if (selectedSupplier) {
            handleOpenDialog(selectedSupplier);
          }
          handleMenuClose();
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedSupplier) {
            handleDeleteClick(selectedSupplier);
          }
        }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Suppliers;
