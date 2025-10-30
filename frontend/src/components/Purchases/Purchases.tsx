import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, MenuItem, Select, InputLabel, FormControl, CircularProgress, Card, CardContent, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { purchasesAPI, suppliersAPI, productsAPI, warehousesAPI } from '../../services/api';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CancelIcon from '@mui/icons-material/Cancel';

const defaultForm = {
  supplier: '',
  warehouse: '',
  items: [{ product: '', quantity: 1, unitPrice: 0 }],
  expectedDeliveryDate: '',
  notes: '',
  tax: 0,
  discount: 0,
  priority: 'medium',
};

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'default';
    case 'pending_approval': return 'warning';
    case 'approved': return 'info';
    case 'rejected': return 'error';
    case 'sent': return 'primary';
    case 'confirmed': return 'primary';
    case 'partial': return 'secondary';
    case 'received': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

// Metrics Dashboard Component
const PurchaseMetrics: React.FC<{ onPeriodChange: (period: string) => void }> = ({ onPeriodChange }) => {
  const [period, setPeriod] = useState('30');
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['purchase-metrics', period],
    queryFn: async () => (await purchasesAPI.getMetrics(period)).data,
  });

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    onPeriodChange(newPeriod);
  };

  if (isLoading) {
    return <Box display="flex" justifyContent="center" p={2}><CircularProgress /></Box>;
  }

  const overview = metrics?.overview || {};
  const statusCounts = metrics?.statusCounts || [];
  const topSuppliers = metrics?.topSuppliers || [];

  return (
    <Box mb={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Purchase Orders Overview</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} label="Period" onChange={(e) => handlePeriodChange(e.target.value)}>
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
            <MenuItem value="365">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Orders</Typography>
            <Typography variant="h4">{overview.totalOrders || 0}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Pending Approval</Typography>
            <Typography variant="h4" color="warning.main">{overview.pendingApproval || 0}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Amount</Typography>
            <Typography variant="h4">₹{(overview.totalAmount || 0).toLocaleString()}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Avg Order Value</Typography>
            <Typography variant="h4">₹{(overview.avgOrderValue || 0).toFixed(0)}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={2}>
        <Card sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Status Breakdown</Typography>
            {statusCounts.map((status: any) => (
              <Box key={status._id} display="flex" justifyContent="space-between" py={0.5}>
                <Box display="flex" alignItems="center">
                  <Chip 
                    label={status._id} 
                    color={getStatusColor(status._id) as any} 
                    size="small" 
                    sx={{ mr: 1 }}
                  />
                </Box>
                <Typography>{status.count}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Top Suppliers</Typography>
            {topSuppliers.map((supplier: any, index: number) => (
              <Box key={supplier._id} display="flex" justifyContent="space-between" py={0.5}>
                <Typography>{supplier.supplier}</Typography>
                <Typography color="textSecondary">{supplier.orderCount} orders</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

type PurchaseFormProps = {
  open: boolean;
  onClose: () => void;
  initialData: any;
  suppliers: any[];
  products: any[];
  warehouses: any[];
};

const PurchaseForm: React.FC<PurchaseFormProps> = ({ open, onClose, initialData, suppliers, products, warehouses }) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(initialData?.['_id']);
  const mutation = useMutation<any, any, any>({
    mutationFn: (data: any) =>
      isEdit
        ? purchasesAPI.update(initialData._id, data)
        : purchasesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      onClose();
    },
  });
  // Helper to map initialData to form values (IDs only)
  function mapInitialDataToForm(data: any) {
    if (!data) return defaultForm;
    let supplierId = '';
    if (typeof data.supplier === 'object' && data.supplier?._id) {
      supplierId = String(data.supplier._id);
    } else if (typeof data.supplier === 'string') {
      supplierId = data.supplier;
    }
    let warehouseId = '';
    if (typeof data.warehouse === 'object' && data.warehouse?._id) {
      warehouseId = String(data.warehouse._id);
    } else if (typeof data.warehouse === 'string') {
      warehouseId = data.warehouse;
    }
    const items = Array.isArray(data.items)
      ? data.items.map((item: any) => {
          let productId = '';
          if (typeof item.product === 'object' && item.product?._id) {
            productId = String(item.product._id);
          } else if (typeof item.product === 'string') {
            productId = item.product;
          }
          return {
            ...item,
            product: productId
          };
        })
      : [{ product: '', quantity: 1, unitPrice: 0 }];
    return {
      ...data,
      supplier: supplierId,
      warehouse: warehouseId,
      items
    };
  }

  const [form, setForm] = useState(mapInitialDataToForm(initialData));
  // Ensure products and warehouses are always arrays
  const safeProducts = Array.isArray(products) ? products : [];
  const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];

  // Reset form when dialog is opened for add or edit
  React.useEffect(() => {
    if (open) {
      setForm(mapInitialDataToForm(initialData));
    }
  }, [open, initialData]);

  const handleItemChange = (idx: number, field: string, value: any) => {
    const items = [...form.items];
    items[idx][field] = value;
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product: '', quantity: 1, unitPrice: 0 }] });
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_: any, i: number) => i !== idx) });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? 'Edit Purchase Order' : 'Add Purchase Order'}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Supplier</InputLabel>
          <Select
            value={form.supplier}
            label="Supplier"
          onChange={e => setForm({ ...form, supplier: String(e.target.value) })}
          >
            {(suppliers || []).map((s: any) => (
              <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Warehouse</InputLabel>
          <Select
            value={form.warehouse}
            label="Warehouse"
          onChange={e => setForm({ ...form, warehouse: String(e.target.value) })}
          >
            {safeWarehouses.map((w: any) => (
              <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="h6" sx={{ mt: 2 }}>Items</Typography>
        {form.items.map((item: any, idx: number) => (
          <Box key={item.product || idx} display="flex" gap={2} alignItems="center" sx={{ mb: 1 }}>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Product</InputLabel>
              <Select
                value={item.product}
                label="Product"
                onChange={e => handleItemChange(idx, 'product', String(e.target.value))}
              >
                {safeProducts.map((p: any) => (
                  <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Quantity"
              type="number"
              value={item.quantity}
              onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
              sx={{ width: 100 }}
            />
            <TextField
              label="Unit Price"
              type="number"
              value={item.unitPrice}
              onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
              sx={{ width: 120 }}
            />
            <Button onClick={() => removeItem(idx)} color="error">Remove</Button>
          </Box>
        ))}
        <Button onClick={addItem} startIcon={<AddIcon />} sx={{ mb: 2 }}>Add Item</Button>
        <TextField label="Expected Delivery Date" type="date" value={form.expectedDeliveryDate} onChange={e => setForm({ ...form, expectedDeliveryDate: e.target.value })} fullWidth sx={{ mb: 2 }} />
        <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} fullWidth sx={{ mb: 2 }} />
        <Box display="flex" gap={2}>
          <TextField label="Tax" type="number" value={form.tax} onChange={e => setForm({ ...form, tax: Number(e.target.value) })} sx={{ width: 120 }} />
          <TextField label="Discount" type="number" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} sx={{ width: 120 }} />
          <FormControl sx={{ width: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={form.priority}
              label="Priority"
              onChange={e => setForm({ ...form, priority: e.target.value })}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {mutation.isError && (
          <Typography color="error" sx={{ mt: 2 }}>
            {typeof mutation.error === 'object' && mutation.error?.response?.data?.message
              ? mutation.error.response.data.message
              : 'Error saving purchase order.'}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => {
            // Send a clean payload with proper types
            const payload = {
              supplier: form.supplier || undefined,
              warehouse: form.warehouse || undefined,
              items: (form.items || []).map((item: any) => ({
                product: item.product || undefined,
                quantity: Number(item.quantity) || 1,
                unitPrice: Number(item.unitPrice) || 0,
                totalPrice: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
              })),
              expectedDeliveryDate: form.expectedDeliveryDate || undefined,
              notes: form.notes || '',
              tax: Number(form.tax) || 0,
              discount: Number(form.discount) || 0
            };
            mutation.mutate(payload);
          }}
          variant="contained"
          disabled={mutation.status === 'pending'}
        >
          {(() => {
            if (mutation.status === 'pending') return 'Saving...';
            if (isEdit) return 'Update';
            return 'Create';
          })()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Purchases: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: '' });
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => (await purchasesAPI.getAll()).data.purchaseOrders,
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await suppliersAPI.getAll()).data,
  });
  const { data: productsData = { products: [] } } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await productsAPI.getAll()).data,
  });
  // Support both array and object with products property
  const products = Array.isArray(productsData) ? productsData : (productsData.products || []);
  const { data: warehousesData = { warehouses: [] } } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => (await warehousesAPI.getAll()).data,
  });
  const warehouses = warehousesData.warehouses;

  // Approval and workflow mutations
  const submitForApprovalMutation = useMutation({
    mutationFn: (id: string) => purchasesAPI.submitForApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-metrics'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => purchasesAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-metrics'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => purchasesAPI.reject(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-metrics'] });
      setRejectionDialog({ open: false, orderId: '' });
      setRejectionReason('');
    },
  });

  const markSentMutation = useMutation({
    mutationFn: (id: string) => purchasesAPI.markSent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-metrics'] });
    },
  });

  const markConfirmedMutation = useMutation({
    mutationFn: (id: string) => purchasesAPI.markConfirmed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-metrics'] });
    },
  });

  const markPartialMutation = useMutation({
    mutationFn: (id: string) => purchasesAPI.markPartial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-metrics'] });
    },
  });

  const markReceivedMutation = useMutation({
    mutationFn: (id: string) => purchasesAPI.markReceived(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-metrics'] });
    },
  });

  const markCancelledMutation = useMutation({
    mutationFn: (id: string) => purchasesAPI.markCancelled(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-metrics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => purchasesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-metrics'] });
    },
  });

  const handleEdit = (po: any) => { setEditing(po); setOpen(true); };
  
  const handleSubmitForApproval = (id: string) => {
    if (window.confirm('Submit this purchase order for approval?')) {
      submitForApprovalMutation.mutate(id);
    }
  };

  const handleApprove = (id: string) => {
    if (window.confirm('Approve this purchase order?')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: string) => {
    setRejectionDialog({ open: true, orderId: id });
  };

  // Workflow action handlers
  const handleMarkSent = (id: string) => {
    if (window.confirm('Mark this purchase order as sent?')) {
      markSentMutation.mutate(id);
    }
  };
  const handleMarkConfirmed = (id: string) => {
    if (window.confirm('Mark this purchase order as confirmed?')) {
      markConfirmedMutation.mutate(id);
    }
  };
  const handleMarkPartial = (id: string) => {
    if (window.confirm('Mark this purchase order as partially received?')) {
      markPartialMutation.mutate(id);
    }
  };
  const handleMarkReceived = (id: string) => {
    if (window.confirm('Mark this purchase order as fully received?')) {
      markReceivedMutation.mutate(id);
    }
  };
  const handleMarkCancelled = (id: string) => {
    if (window.confirm('Cancel this purchase order?')) {
      markCancelledMutation.mutate(id);
    }
  };

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>;

  return (
    <Box>
      <PurchaseMetrics onPeriodChange={() => {}} />
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Purchase Orders</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setOpen(true); setEditing(null); }}>Add</Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((po: any) => (
              <TableRow key={po._id}>
                <TableCell>{po.orderNumber}</TableCell>
                <TableCell>{po.supplier?.name || ''}</TableCell>
                <TableCell>{po.warehouse?.name || ''}</TableCell>
                <TableCell>
                  <Chip 
                    label={po.status} 
                    color={getStatusColor(po.status) as any} 
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={po.priority || 'medium'} 
                    variant="outlined"
                    size="small"
                    color={(() => {
                      if (po.priority === 'urgent') return 'error';
                      if (po.priority === 'high') return 'warning';
                      return 'default';
                    })() as any}
                  />
                </TableCell>
                <TableCell>{po.orderDate ? new Date(po.orderDate).toLocaleDateString() : ''}</TableCell>
                <TableCell>₹{po.totalAmount?.toFixed(2)}</TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5}>
                    {/* Edit button for draft orders */}
                    {po.status === 'draft' && (
                      <IconButton onClick={() => handleEdit(po)} size="small">
                        <EditIcon />
                      </IconButton>
                    )}

                    {/* Submit for approval button */}
                    {po.status === 'draft' && (
                      <IconButton 
                        onClick={() => handleSubmitForApproval(po._id)} 
                        size="small"
                        disabled={submitForApprovalMutation.status === 'pending'}
                      >
                        <SendIcon />
                      </IconButton>
                    )}


                    {/* Approval buttons (for admins) */}
                    {po.status === 'pending_approval' && (
                      <>
                        <IconButton 
                          onClick={() => handleApprove(po._id)} 
                          size="small"
                          disabled={approveMutation.status === 'pending'}
                          color="success"
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleReject(po._id)} 
                          size="small"
                          disabled={rejectMutation.status === 'pending'}
                          color="error"
                        >
                          <CloseIcon />
                        </IconButton>
                      </>
                    )}

                    {/* Mark as Sent (for approved orders) */}
                    {po.status === 'approved' && (
                      <IconButton
                        onClick={() => handleMarkSent(po._id)}
                        size="small"
                        disabled={markSentMutation.status === 'pending'}
                        color="primary"
                        title="Mark as Sent"
                      >
                        <SendIcon />
                      </IconButton>
                    )}

                    {/* Mark as Confirmed/Partial/Received/Cancelled (for sent orders) */}
                    {po.status === 'sent' && (
                      <>
                        <IconButton
                          onClick={() => handleMarkConfirmed(po._id)}
                          size="small"
                          disabled={markConfirmedMutation.status === 'pending'}
                          color="primary"
                          title="Mark as Confirmed"
                        >
                          <AssignmentTurnedInIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleMarkPartial(po._id)}
                          size="small"
                          disabled={markPartialMutation.status === 'pending'}
                          color="secondary"
                          title="Mark as Partial"
                        >
                          <PlaylistAddCheckIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleMarkReceived(po._id)}
                          size="small"
                          disabled={markReceivedMutation.status === 'pending'}
                          color="success"
                          title="Mark as Received"
                        >
                          <DoneAllIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleMarkCancelled(po._id)}
                          size="small"
                          disabled={markCancelledMutation.status === 'pending'}
                          color="error"
                          title="Cancel Order"
                        >
                          <CancelIcon />
                        </IconButton>
                      </>
                    )}

                    {/* Delete button for draft orders only */}
                    {po.status === 'draft' && (
                      <IconButton 
                        onClick={() => deleteMutation.mutate(po._id)} 
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <PurchaseForm
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        initialData={editing}
        suppliers={suppliers}
        products={products}
        warehouses={warehouses}
      />

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog.open} onClose={() => setRejectionDialog({ open: false, orderId: '' })}>
        <DialogTitle>Reject Purchase Order</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialog({ open: false, orderId: '' })}>Cancel</Button>
          <Button 
            onClick={() => {
              if (!rejectionReason.trim()) {
                alert('Please provide a rejection reason');
                return;
              }
              rejectMutation.mutate({ id: rejectionDialog.orderId, reason: rejectionReason });
            }} 
            variant="contained" 
            color="error"
            disabled={rejectMutation.status === 'pending'}
          >
            {rejectMutation.status === 'pending' ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Purchases;
