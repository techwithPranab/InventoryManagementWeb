'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, Paper, Chip, IconButton, Box, Typography } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { toast } from 'sonner';

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  maxProducts: number;
  maxWarehouses: number;
  maxUsers: number;
  isActive: boolean;
  stripePriceId?: string;
  createdAt: string;
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    billingCycle: 'monthly',
    features: [''],
    maxProducts: '',
    maxWarehouses: '',
    maxUsers: '',
    stripePriceId: ''
  });

  const router = useRouter();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/admin/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      } else {
        toast.error('Failed to fetch subscription plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error fetching subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: Number.parseFloat(formData.price),
          maxProducts: Number.parseInt(formData.maxProducts),
          maxWarehouses: Number.parseInt(formData.maxWarehouses),
          maxUsers: Number.parseInt(formData.maxUsers),
          features: formData.features.filter(f => f.trim() !== '')
        })
      });

      if (response.ok) {
        toast.success('Subscription plan created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchPlans();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Error creating subscription plan');
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/subscriptions/${selectedPlan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: Number.parseFloat(formData.price),
          maxProducts: Number.parseInt(formData.maxProducts),
          maxWarehouses: Number.parseInt(formData.maxWarehouses),
          maxUsers: Number.parseInt(formData.maxUsers),
          features: formData.features.filter(f => f.trim() !== '')
        })
      });

      if (response.ok) {
        toast.success('Subscription plan updated successfully');
        setIsEditDialogOpen(false);
        resetForm();
        fetchPlans();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Error updating subscription plan');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/subscriptions/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Subscription plan deleted successfully');
        fetchPlans();
      } else {
        toast.error('Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Error deleting subscription plan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'USD',
      billingCycle: 'monthly',
      features: [''],
      maxProducts: '',
      maxWarehouses: '',
      maxUsers: '',
      stripePriceId: ''
    });
    setSelectedPlan(null);
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: plan.features.length > 0 ? plan.features : [''],
      maxProducts: plan.maxProducts.toString(),
      maxWarehouses: plan.maxWarehouses.toString(),
      maxUsers: plan.maxUsers.toString(),
      stripePriceId: plan.stripePriceId || ''
    });
    setIsEditDialogOpen(true);
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="64vh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </Box>
    );
  }

  return (
    <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary">
              Subscription Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage subscription plans and pricing
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            Add Plan
          </Button>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Box mb={2}>
            <TextField
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <Search sx={{ mr: 1 }} />
                }
              }}
              variant="outlined"
              size="small"
              sx={{ width: 300 }}
            />
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Cycle</TableCell>
                <TableCell>Max Products</TableCell>
                <TableCell>Max Warehouses</TableCell>
                <TableCell>Max Users</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow key={plan._id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">{plan.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{plan.description}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>${plan.price} {plan.currency}</TableCell>
                  <TableCell>
                    <Chip label={plan.billingCycle} variant="outlined" />
                  </TableCell>
                  <TableCell>{plan.maxProducts}</TableCell>
                  <TableCell>{plan.maxWarehouses}</TableCell>
                  <TableCell>{plan.maxUsers}</TableCell>
                  <TableCell>
                    <Chip
                      label={plan.isActive ? 'Active' : 'Inactive'}
                      color={plan.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEditDialog(plan)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeletePlan(plan._id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Subscription Plan</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Plan Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  sx={{ flex: '1 1 200px' }}
                  required
                />
                <TextField
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  sx={{ flex: '1 1 200px' }}
                  required
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ flex: '1 1 200px' }} required>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                    <MenuItem value="INR">INR</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: '1 1 200px' }} required>
                  <InputLabel>Billing Cycle</InputLabel>
                  <Select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value }))}
                  >
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
                fullWidth
                required
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Max Products"
                  type="number"
                  value={formData.maxProducts}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxProducts: e.target.value }))}
                  sx={{ flex: '1 1 150px' }}
                  required
                />
                <TextField
                  label="Max Warehouses"
                  type="number"
                  value={formData.maxWarehouses}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxWarehouses: e.target.value }))}
                  sx={{ flex: '1 1 150px' }}
                  required
                />
                <TextField
                  label="Max Users"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: e.target.value }))}
                  sx={{ flex: '1 1 150px' }}
                  required
                />
              </Box>

              <Box>
                <Typography variant="body1" mb={1}>Features</Typography>
                {formData.features.map((feature, index) => (
                  <Box key={`create-feature-${index}-${feature.substring(0, 10)}`} display="flex" gap={1} mb={1}>
                    <TextField
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="e.g., Advanced reporting"
                      fullWidth
                    />
                    {formData.features.length > 1 && (
                      <Button
                        type="button"
                        variant="outlined"
                        size="small"
                        onClick={() => removeFeature(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                ))}
                <Button type="button" variant="outlined" onClick={addFeature}>
                  Add Feature
                </Button>
              </Box>

              <TextField
                label="Stripe Price ID (Optional)"
                value={formData.stripePriceId}
                onChange={(e) => setFormData(prev => ({ ...prev, stripePriceId: e.target.value }))}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePlan} variant="contained">Create Plan</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Subscription Plan</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Plan Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  sx={{ flex: '1 1 200px' }}
                  required
                />
                <TextField
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  sx={{ flex: '1 1 200px' }}
                  required
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ flex: '1 1 200px' }} required>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                    <MenuItem value="INR">INR</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: '1 1 200px' }} required>
                  <InputLabel>Billing Cycle</InputLabel>
                  <Select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value }))}
                  >
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
                fullWidth
                required
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Max Products"
                  type="number"
                  value={formData.maxProducts}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxProducts: e.target.value }))}
                  sx={{ flex: '1 1 150px' }}
                  required
                />
                <TextField
                  label="Max Warehouses"
                  type="number"
                  value={formData.maxWarehouses}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxWarehouses: e.target.value }))}
                  sx={{ flex: '1 1 150px' }}
                  required
                />
                <TextField
                  label="Max Users"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: e.target.value }))}
                  sx={{ flex: '1 1 150px' }}
                  required
                />
              </Box>

              <Box>
                <Typography variant="body1" mb={1}>Features</Typography>
                {formData.features.map((feature, index) => (
                  <Box key={`edit-feature-${index}-${feature.substring(0, 10)}`} display="flex" gap={1} mb={1}>
                    <TextField
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="e.g., Advanced reporting"
                      fullWidth
                    />
                    {formData.features.length > 1 && (
                      <Button
                        type="button"
                        variant="outlined"
                        size="small"
                        onClick={() => removeFeature(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                ))}
                <Button type="button" variant="outlined" onClick={addFeature}>
                  Add Feature
                </Button>
              </Box>

              <TextField
                label="Stripe Price ID (Optional)"
                value={formData.stripePriceId}
                onChange={(e) => setFormData(prev => ({ ...prev, stripePriceId: e.target.value }))}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePlan} variant="contained">Update Plan</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
