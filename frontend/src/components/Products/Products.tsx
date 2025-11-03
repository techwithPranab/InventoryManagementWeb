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
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, categoriesAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import ProductImageManager from '../ProductImageManager';

interface ProductImage {
  _id: string;
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  responsiveUrls: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  };
  uploadedAt: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  slug: string;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  brand: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderLevel: number;
  images: ProductImage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category: string;
  brand: string;
  unit: string;
  costPrice: number | string;
  sellingPrice: number | string;
  minStockLevel: number | string;
  maxStockLevel: number | string;
  reorderLevel: number | string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const Products: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    category: '',
    brand: '',
    unit: 'piece',
    costPrice: 0,
    sellingPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    reorderLevel: 0,
  });
  const [formErrors, setFormErrors] = useState<Partial<ProductFormData>>({});

  const queryClient = useQueryClient();

  // Fetch products
  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', { search: searchTerm, category: categoryFilter, page, limit: rowsPerPage }],
    queryFn: async () => {
      const response = await productsAPI.getAll({
        search: searchTerm,
        category: categoryFilter,
        page: page + 1,
        limit: rowsPerPage,
      });
      return response.data;
    },
  });

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll();
      return response.data;
    },
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData | ProductFormData) => productsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDialog();
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData | ProductFormData }) =>
      productsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDialog();
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
  });

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductImages(product.images || []);
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description,
        category: product.category._id,
        brand: product.brand,
        unit: product.unit,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        minStockLevel: product.minStockLevel,
        maxStockLevel: product.maxStockLevel,
        reorderLevel: product.reorderLevel,
      });
    } else {
      setEditingProduct(null);
      setProductImages([]);
      setFormData({
        name: '',
        sku: '',
        description: '',
        category: '',
        brand: '',
        unit: 'piece',
        costPrice: 0,
        sellingPrice: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        reorderLevel: 0,
      });
    }
    setFormErrors({});
    setTabValue(0);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingProduct(null);
    setProductImages([]);
    setTabValue(0);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<ProductFormData> = {};

    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.brand.trim()) errors.brand = 'Brand is required';
    if (Number(formData.costPrice) <= 0) errors.costPrice = 'Cost price must be greater than 0';
    if (Number(formData.sellingPrice) <= 0) errors.sellingPrice = 'Selling price must be greater than 0';
    if (Number(formData.sellingPrice) <= Number(formData.costPrice)) {
      errors.sellingPrice = 'Selling price must be greater than cost price';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createFormData = (productData: any, imageFiles?: File[]): FormData => {
    const formData = new FormData();
    
    // Add product data
    Object.keys(productData).forEach(key => {
      formData.append(key, productData[key]);
    });

    // Add product slug for image organization
    if (productData.name && productData.sku) {
      const slug = `${productData.name}-${productData.sku}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      formData.append('productSlug', slug);
    }

    // Add image files if any
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach(file => {
        formData.append('productImages', file);
      });
    }

    return formData;
  };

  const handleSubmit = (imageFiles?: File[]) => {
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      minStockLevel: Number(formData.minStockLevel),
      maxStockLevel: Number(formData.maxStockLevel),
      reorderLevel: Number(formData.reorderLevel),
    };

    // Use FormData if we have image files, otherwise send JSON
    const finalData = imageFiles && imageFiles.length > 0 
      ? createFormData(submitData, imageFiles)
      : submitData;

    if (editingProduct) {
      updateMutation.mutate({
        id: editingProduct._id,
        data: finalData,
      });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete._id);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMarginPercent = (cost: number, selling: number) => {
    return (((selling - cost) / selling) * 100).toFixed(1);
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading products. Please try again.
      </Alert>
    );
  }

  const filteredProducts = products?.products || [];
  const totalCount = products?.total || 0;
  const categoryOptions = categories?.categories || [];

  return (
    <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="700" gutterBottom color="#212529">
            Product Management
          </Typography>
          <Typography variant="body1" color="#6c757d" fontWeight="500">
            Manage your product catalog and inventory
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
                <InventoryIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="600" color="#212529">
                  {totalCount}
                </Typography>
                <Typography color="#6c757d" variant="body2" fontWeight="500">
                  Total Products
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
                  {filteredProducts.filter((p: Product) => p.isActive).length}
                </Typography>
                <Typography color="#6c757d" variant="body2" fontWeight="500">
                  Active Products
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
                <TrendingUpIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="600" color="#212529">
                  {formatCurrency(
                    filteredProducts.reduce((sum: number, p: Product) => sum + p.sellingPrice, 0) / (filteredProducts.length || 1)
                  )}
                </Typography>
                <Typography color="#6c757d" variant="body2" fontWeight="500">
                  Avg. Price
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
                <WarningIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="600" color="#212529">
                  {categoryOptions.length}
                </Typography>
                <Typography color="#6c757d" variant="body2" fontWeight="500">
                  Categories
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
                placeholder="Search products..."
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
              <FormControl sx={{ 
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f8f9fa',
                  '& fieldset': { borderColor: '#dee2e6' },
                  '&:hover fieldset': { borderColor: '#495057' },
                  '&.Mui-focused fieldset': { borderColor: '#495057' }
                }
              }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categoryOptions.map((category: Category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              Add Product
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card sx={{ bgcolor: '#ffffff', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Brand</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Cost Price</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Selling Price</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Margin</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Created</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#495057', borderBottom: '2px solid #dee2e6' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product: Product) => (
                <TableRow key={product._id} hover sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Box display="flex" alignItems="center">
                      <Avatar 
                        sx={{ mr: 2, width: 36, height: 36 }}
                        src={product.images?.[0]?.responsiveUrls?.thumbnail}
                      >
                        <Typography variant="body2" fontWeight="600">
                          {product.name.charAt(0).toUpperCase()}
                        </Typography>
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600" color="#212529">
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="#6c757d">
                          {product.description.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Typography variant="body2" fontFamily="'JetBrains Mono', monospace" color="#495057" fontSize="0.875rem">
                      {product.sku}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Chip
                      label={product.category.name}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderColor: '#6c757d',
                        color: '#495057',
                        bgcolor: '#f8f9fa',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Typography variant="body2" color="#495057" fontWeight="500">
                      {product.brand}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Typography variant="body2" color="#6c757d">
                      {formatCurrency(product.costPrice)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Typography variant="body2" fontWeight="600" color="#212529">
                      {formatCurrency(product.sellingPrice)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Typography variant="body2" color="#28a745" fontWeight="600">
                      {getMarginPercent(product.costPrice, product.sellingPrice)}%
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Chip
                      label={product.isActive ? 'Active' : 'Inactive'}
                      color={product.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{
                        fontWeight: 500,
                        ...(product.isActive ? {
                          bgcolor: '#d4edda',
                          color: '#155724',
                          borderColor: '#c3e6cb'
                        } : {
                          bgcolor: '#f8d7da',
                          color: '#721c24',
                          borderColor: '#f5c6cb'
                        })
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Typography variant="body2" color="#6c757d">
                      {formatDate(product.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(product)}
                        sx={{ 
                          color: '#6c757d',
                          '&:hover': { 
                            color: '#495057',
                            bgcolor: '#f8f9fa'
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, product)}
                      sx={{ 
                        color: '#6c757d',
                        '&:hover': { 
                          color: '#495057',
                          bgcolor: '#f8f9fa'
                        }
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
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
          sx={{
            borderTop: '1px solid #dee2e6',
            bgcolor: '#f8f9fa',
            '& .MuiTablePagination-toolbar': {
              color: '#495057'
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              color: '#6c757d',
              fontWeight: 500
            }
          }}
        />
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          bgcolor: '#495057',
          color: 'white',
          '&:hover': {
            bgcolor: '#343a40'
          }
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={open} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              border: '1px solid #dee2e6',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f8f9fa', 
          borderBottom: '1px solid #dee2e6',
          color: '#212529',
          fontWeight: 600,
          pb: 0
        }}>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ mt: 2 }}
          >
            <Tab 
              icon={<InfoIcon />} 
              label="Product Details" 
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
            <Tab 
              icon={<ImageIcon />} 
              label="Images" 
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#ffffff', py: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#dee2e6' },
                      '&:hover fieldset': { borderColor: '#495057' },
                      '&.Mui-focused fieldset': { borderColor: '#495057' }
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  error={!!formErrors.sku}
                  helperText={formErrors.sku}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#dee2e6' },
                      '&:hover fieldset': { borderColor: '#495057' },
                      '&.Mui-focused fieldset': { borderColor: '#495057' }
                    }
                  }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={!!formErrors.description}
                helperText={formErrors.description}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#dee2e6' },
                    '&:hover fieldset': { borderColor: '#495057' },
                    '&.Mui-focused fieldset': { borderColor: '#495057' }
                  }
                }}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                <FormControl fullWidth error={!!formErrors.category}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#dee2e6' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#495057' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#495057' }
                    }}
                  >
                    {categoryOptions.map((category: Category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  error={!!formErrors.brand}
                  helperText={formErrors.brand}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#dee2e6' },
                      '&:hover fieldset': { borderColor: '#495057' },
                      '&.Mui-focused fieldset': { borderColor: '#495057' }
                    }
                  }}
                />

                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.unit}
                    label="Unit"
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#dee2e6' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#495057' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#495057' }
                    }}
                  >
                    <MenuItem value="piece">Piece</MenuItem>
                    <MenuItem value="kg">Kilogram</MenuItem>
                    <MenuItem value="liter">Liter</MenuItem>
                    <MenuItem value="meter">Meter</MenuItem>
                    <MenuItem value="box">Box</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Cost Price"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  error={!!formErrors.costPrice}
                  helperText={formErrors.costPrice}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#dee2e6' },
                      '&:hover fieldset': { borderColor: '#495057' },
                      '&.Mui-focused fieldset': { borderColor: '#495057' }
                    }
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Selling Price"
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  error={!!formErrors.sellingPrice}
                  helperText={formErrors.sellingPrice}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#dee2e6' },
                      '&:hover fieldset': { borderColor: '#495057' },
                      '&.Mui-focused fieldset': { borderColor: '#495057' }
                    }
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Min Stock Level"
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#dee2e6' },
                      '&:hover fieldset': { borderColor: '#495057' },
                      '&.Mui-focused fieldset': { borderColor: '#495057' }
                    }
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Max Stock Level"
                  type="number"
                  value={formData.maxStockLevel}
                  onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#dee2e6' },
                      '&:hover fieldset': { borderColor: '#495057' },
                      '&.Mui-focused fieldset': { borderColor: '#495057' }
                    }
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Reorder Level"
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#dee2e6' },
                      '&:hover fieldset': { borderColor: '#495057' },
                      '&.Mui-focused fieldset': { borderColor: '#495057' }
                    }
                  }}
                />
              </Box>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {editingProduct ? (
              <Box sx={{ pt: 1 }}>
                <ProductImageManager
                  productSlug={editingProduct.slug}
                  images={productImages}
                  onImagesChange={setProductImages}
                  maxImages={10}
                  disabled={false}
                />
              </Box>
            ) : (
              <Box sx={{ pt: 1, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Please save the product first to upload images.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You can add images after creating the product by editing it.
                </Typography>
              </Box>
            )}
          </TabPanel>
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: '#f8f9fa', 
          borderTop: '1px solid #dee2e6',
          px: 3,
          py: 2
        }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              color: '#6c757d',
              fontWeight: 500,
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#e9ecef'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit()}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
            sx={{
              bgcolor: '#495057',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              '&:hover': {
                bgcolor: '#343a40'
              },
              '&:disabled': {
                bgcolor: '#adb5bd'
              }
            }}
          >
            {editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              border: '1px solid #dee2e6',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f8f9fa', 
          borderBottom: '1px solid #dee2e6',
          color: '#dc3545',
          fontWeight: 600
        }}>
          Delete Product
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#ffffff', py: 3 }}>
          <Typography color="#495057">
            Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: '#f8f9fa', 
          borderTop: '1px solid #dee2e6',
          px: 3,
          py: 2
        }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: '#6c757d',
              fontWeight: 500,
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#e9ecef'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleteMutation.isPending}
            sx={{
              bgcolor: '#dc3545',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              '&:hover': {
                bgcolor: '#c82333'
              },
              '&:disabled': {
                bgcolor: '#adb5bd'
              }
            }}
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
        slotProps={{
          paper: {
            sx: {
              border: '1px solid #dee2e6',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: 120
            }
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            if (selectedProduct) handleOpenDialog(selectedProduct);
            handleMenuClose();
          }}
          sx={{
            color: '#495057',
            fontWeight: 500,
            '&:hover': {
              bgcolor: '#f8f9fa'
            }
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1, color: '#6c757d' }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedProduct) handleDeleteClick(selectedProduct);
          }}
          sx={{ 
            color: '#dc3545',
            fontWeight: 500,
            '&:hover': {
              bgcolor: '#f8d7da'
            }
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Products;
