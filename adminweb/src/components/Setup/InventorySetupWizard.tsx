import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Warehouse as WarehouseIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';

interface Category {
  _id?: string;
  name: string;
  description: string;
}

interface Warehouse {
  _id?: string;
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  capacity: number;
  type: 'primary' | 'secondary' | 'distribution';
}

interface Product {
  _id?: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  minStockLevel: number;
}

const steps = [
  {
    label: 'Business Information',
    icon: <BusinessIcon />,
    description: 'Tell us about your business'
  },
  {
    label: 'Categories',
    icon: <CategoryIcon />,
    description: 'Create product categories'
  },
  {
    label: 'Warehouses',
    icon: <WarehouseIcon />,
    description: 'Set up your storage locations'
  },
  {
    label: 'Products',
    icon: <InventoryIcon />,
    description: 'Add your initial products'
  },
  {
    label: 'Complete',
    icon: <CheckCircleIcon />,
    description: 'Finish setup'
  }
];

const InventorySetupWizard: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [businessInfo, setBusinessInfo] = useState({
    industry: '',
    companySize: '',
    setupGoals: ''
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [warehouseDialog, setWarehouseDialog] = useState(false);
  const [productDialog, setProductDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [setupProgress, setSetupProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Complete setup
      completeSetup();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const completeSetup = async () => {
    if (!clientId) return;

    setIsLoading(true);
    try {
      setSetupProgress(10);

      // Save categories
      if (categories.length > 0) {
        setSetupProgress(25);
        await saveCategories();
      }

      // Save warehouses
      if (warehouses.length > 0) {
        setSetupProgress(50);
        await saveWarehouses();
      }

      // Save products
      if (products.length > 0) {
        setSetupProgress(75);
        await saveProducts();
      }

      setSetupProgress(100);

      // Mark setup as completed
      await markSetupComplete();

      setTimeout(() => {
        router.push('/admin/inventory');
      }, 1000);

    } catch (error) {
      console.error('Setup completion failed:', error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const saveCategories = async () => {
    const token = localStorage.getItem('token');
    for (const category of categories) {
      await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Client-ID': clientId
        },
        body: JSON.stringify(category)
      });
    }
  };

  const saveWarehouses = async () => {
    const token = localStorage.getItem('token');
    for (const warehouse of warehouses) {
      await fetch('/api/admin/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Client-ID': clientId
        },
        body: JSON.stringify(warehouse)
      });
    }
  };

  const saveProducts = async () => {
    const token = localStorage.getItem('token');
    for (const product of products) {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Client-ID': clientId
        },
        body: JSON.stringify(product)
      });
    }
  };

  const markSetupComplete = async () => {
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/inventory-setups/${clientId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };

  const handleCategorySubmit = (category: Category) => {
    if (editingItem) {
      setCategories(categories.map(cat =>
        cat._id === editingItem._id ? { ...category, _id: editingItem._id } : cat
      ));
    } else {
      setCategories([...categories, { ...category, _id: Date.now().toString() }]);
    }
    setCategoryDialog(false);
    setEditingItem(null);
  };

  const handleWarehouseSubmit = (warehouse: Warehouse) => {
    if (editingItem) {
      setWarehouses(warehouses.map(wh =>
        wh._id === editingItem._id ? { ...warehouse, _id: editingItem._id } : wh
      ));
    } else {
      setWarehouses([...warehouses, { ...warehouse, _id: Date.now().toString() }]);
    }
    setWarehouseDialog(false);
    setEditingItem(null);
  };

  const handleProductSubmit = (product: Product) => {
    if (editingItem) {
      setProducts(products.map(prod =>
        prod._id === editingItem._id ? { ...product, _id: editingItem._id } : prod
      ));
    } else {
      setProducts([...products, { ...product, _id: Date.now().toString() }]);
    }
    setProductDialog(false);
    setEditingItem(null);
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(cat => cat._id !== id));
  };

  const deleteWarehouse = (id: string) => {
    setWarehouses(warehouses.filter(wh => wh._id !== id));
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(prod => prod._id !== id));
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tell us about your business
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <FormControl fullWidth>
                    <InputLabel>Industry</InputLabel>
                    <Select
                      value={businessInfo.industry}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, industry: e.target.value })}
                    >
                      <MenuItem value="grocery">Grocery</MenuItem>
                      <MenuItem value="electronics">Electronics</MenuItem>
                      <MenuItem value="pharmaceutical">Pharmaceutical</MenuItem>
                      <MenuItem value="textile">Textile</MenuItem>
                      <MenuItem value="automotive">Automotive</MenuItem>
                      <MenuItem value="construction">Construction</MenuItem>
                      <MenuItem value="manufacturing">Manufacturing</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <FormControl fullWidth>
                    <InputLabel>Company Size</InputLabel>
                    <Select
                      value={businessInfo.companySize}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, companySize: e.target.value })}
                    >
                      <MenuItem value="small">Small (1-10 employees)</MenuItem>
                      <MenuItem value="medium">Medium (11-50 employees)</MenuItem>
                      <MenuItem value="large">Large (51-200 employees)</MenuItem>
                      <MenuItem value="enterprise">Enterprise (200+ employees)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Setup Goals"
                  placeholder="What do you want to achieve with inventory management?"
                  value={businessInfo.setupGoals}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, setupGoals: e.target.value })}
                />
              </Box>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Product Categories ({categories.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCategoryDialog(true)}
              >
                Add Category
              </Button>
            </Box>

            {categories.length === 0 ? (
              <Alert severity="info">
                No categories added yet. Click "Add Category" to get started.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {categories.map((category) => (
                  <Box key={category._id} sx={{ flex: '1 1 300px', minWidth: '280px', maxWidth: '350px' }}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="h6">{category.name}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {category.description}
                            </Typography>
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingItem(category);
                                setCategoryDialog(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteCategory(category._id!)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Warehouses ({warehouses.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setWarehouseDialog(true)}
              >
                Add Warehouse
              </Button>
            </Box>

            {warehouses.length === 0 ? (
              <Alert severity="info">
                No warehouses added yet. Click "Add Warehouse" to get started.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {warehouses.map((warehouse) => (
                  <Box key={warehouse._id} sx={{ flex: '1 1 300px', minWidth: '280px', maxWidth: '350px' }}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="h6">{warehouse.name}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Code: {warehouse.code}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {warehouse.address.city}, {warehouse.address.state}
                            </Typography>
                            <Chip
                              label={warehouse.type}
                              size="small"
                              color="primary"
                              sx={{ mt: 1 }}
                            />
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingItem(warehouse);
                                setWarehouseDialog(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteWarehouse(warehouse._id!)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Products ({products.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setProductDialog(true)}
              >
                Add Product
              </Button>
            </Box>

            {products.length === 0 ? (
              <Alert severity="info">
                No products added yet. Click "Add Product" to get started.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {products.map((product) => (
                  <Box key={product._id} sx={{ flex: '1 1 300px', minWidth: '280px', maxWidth: '350px' }}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="h6">{product.name}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              SKU: {product.sku}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Category: {categories.find(cat => cat._id === product.category)?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              ${product.sellingPrice}
                            </Typography>
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingItem(product);
                                setProductDialog(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteProduct(product._id!)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Setup Complete!
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Your inventory system is ready to use. You can now start managing your inventory,
              processing orders, and tracking your business metrics.
            </Typography>

            {setupProgress > 0 && setupProgress < 100 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Setting up your data...
                </Typography>
                <LinearProgress variant="determinate" value={setupProgress} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            )}

            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Summary:</strong><br />
                • {categories.length} categories created<br />
                • {warehouses.length} warehouses configured<br />
                • {products.length} products added
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  const canProceedToNext = () => {
    switch (activeStep) {
      case 0:
        return businessInfo.industry && businessInfo.companySize;
      case 1:
        return categories.length > 0;
      case 2:
        return warehouses.length > 0;
      case 3:
        return products.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
            Inventory Setup Wizard
          </Typography>
          <Typography variant="h6" align="center" color="textSecondary" sx={{ mb: 4 }}>
            Setting up inventory for client: {clientId}
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  icon={step.icon}
                  optional={
                    index === steps.length - 1 ? (
                      <Typography variant="caption">Last step</Typography>
                    ) : null
                  }
                >
                  <Typography variant="body2" fontWeight="medium">
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 2, mb: 4 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceedToNext() || isLoading}
            >
              {activeStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            </Button>
          </Box>
        </Paper>

        {/* Category Dialog */}
        <CategoryDialog
          open={categoryDialog}
          onClose={() => {
            setCategoryDialog(false);
            setEditingItem(null);
          }}
          onSubmit={handleCategorySubmit}
          initialData={editingItem}
        />

        {/* Warehouse Dialog */}
        <WarehouseDialog
          open={warehouseDialog}
          onClose={() => {
            setWarehouseDialog(false);
            setEditingItem(null);
          }}
          onSubmit={handleWarehouseSubmit}
          initialData={editingItem}
        />

        {/* Product Dialog */}
        <ProductDialog
          open={productDialog}
          onClose={() => {
            setProductDialog(false);
            setEditingItem(null);
          }}
          onSubmit={handleProductSubmit}
          initialData={editingItem}
          categories={categories}
        />
      </Box>
    </Box>
  );
};

// Category Dialog Component
interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (category: Category) => void;
  initialData?: Category;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Category>({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [initialData, open]);

  const handleSubmit = () => {
    if (formData.name.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Category' : 'Add Category'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.name.trim()}>
          {initialData ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Warehouse Dialog Component
interface WarehouseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (warehouse: Warehouse) => void;
  initialData?: Warehouse;
}

const WarehouseDialog: React.FC<WarehouseDialogProps> = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Warehouse>({
    name: '',
    code: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    capacity: 0,
    type: 'primary'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        code: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        capacity: 0,
        type: 'primary'
      });
    }
  }, [initialData, open]);

  const handleSubmit = () => {
    if (formData.name.trim() && formData.code.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Warehouse Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Warehouse Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Warehouse['type'] })}
                >
                  <MenuItem value="primary">Primary</MenuItem>
                  <MenuItem value="secondary">Secondary</MenuItem>
                  <MenuItem value="distribution">Distribution</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                fullWidth
                type="number"
                label="Capacity (sq ft)"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <TextField
                fullWidth
                label="City"
                value={formData.address.city}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })}
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <TextField
                fullWidth
                label="State/Province"
                value={formData.address.state}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value }
                })}
              />
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '140px' }}>
              <TextField
                fullWidth
                label="ZIP/Postal Code"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, zipCode: e.target.value }
                })}
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <TextField
                fullWidth
                label="Country"
                value={formData.address.country}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, country: e.target.value }
                })}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.name.trim() || !formData.code.trim()}>
          {initialData ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Product Dialog Component
interface ProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => void;
  initialData?: Product;
  categories: Category[];
}

const ProductDialog: React.FC<ProductDialogProps> = ({ open, onClose, onSubmit, initialData, categories }) => {
  const [formData, setFormData] = useState<Product>({
    name: '',
    sku: '',
    description: '',
    category: '',
    unit: 'pcs',
    costPrice: 0,
    sellingPrice: 0,
    reorderLevel: 10,
    minStockLevel: 5
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        sku: '',
        description: '',
        category: '',
        unit: 'pcs',
        costPrice: 0,
        sellingPrice: 0,
        reorderLevel: 10,
        minStockLevel: 5
      });
    }
  }, [initialData, open]);

  const handleSubmit = () => {
    if (formData.name.trim() && formData.sku.trim() && formData.category) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? 'Edit Product' : 'Add Product'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                required
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <MenuItem value="pcs">Pieces (pcs)</MenuItem>
                  <MenuItem value="kg">Kilograms (kg)</MenuItem>
                  <MenuItem value="lbs">Pounds (lbs)</MenuItem>
                  <MenuItem value="liters">Liters (L)</MenuItem>
                  <MenuItem value="gallons">Gallons (gal)</MenuItem>
                  <MenuItem value="meters">Meters (m)</MenuItem>
                  <MenuItem value="feet">Feet (ft)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <TextField
                fullWidth
                type="number"
                label="Cost Price"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <TextField
                fullWidth
                type="number"
                label="Selling Price"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <TextField
                fullWidth
                type="number"
                label="Reorder Level"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                inputProps={{ min: 0 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Stock Level"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                inputProps={{ min: 0 }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.name.trim() || !formData.sku.trim() || !formData.category}>
          {initialData ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventorySetupWizard;
