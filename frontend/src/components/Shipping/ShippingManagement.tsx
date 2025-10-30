import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, MenuItem, Select, InputLabel, FormControl, CircularProgress, Chip
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { shippingAPI } from '../../services/api';
// Status chip with color and icon
function getStatusProps(status: string) {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'warning' as const, icon: HourglassEmptyIcon };
    case 'shipped':
      return { label: 'Shipped', color: 'info' as const, icon: LocalShippingIcon };
    case 'in_transit':
      return { label: 'In Transit', color: 'primary' as const, icon: DirectionsTransitIcon };
    case 'delivered':
      return { label: 'Delivered', color: 'success' as const, icon: CheckCircleIcon };
    case 'cancelled':
      return { label: 'Cancelled', color: 'error' as const, icon: CancelIcon };
    default:
      return { label: status, color: 'default' as const, icon: undefined };
  }
}

function StatusChip({ status }: { status: string }) {
  const s = getStatusProps(status);
  const Icon = s.icon;
  return (
    <Chip
      icon={Icon ? <Icon fontSize="small" /> : undefined}
      label={s.label}
      color={s.color}
      size="small"
      sx={{ fontWeight: 500, minWidth: 100 }}
      variant={s.color === 'default' ? 'outlined' : 'filled'}
    />
  );
}


const statusOptions = [
  'pending',
  'shipped',
  'in_transit',
  'delivered',
  'cancelled'
];

const defaultForm = {
  order: '',
  carrier: '',
  trackingNumber: '',
  shippedDate: '',
  estimatedDelivery: '',
  deliveredDate: '',
  status: 'pending',
  shippingAddress: {
    street: '', city: '', state: '', zipCode: '', country: ''
  },
  notes: '',
  cost: 0
};

const ShippingForm = ({ open, onClose, initialData }: any) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(initialData?._id);
  const [form, setForm] = useState(initialData || defaultForm);
  React.useEffect(() => { if (open) setForm(initialData || defaultForm); }, [open, initialData]);
  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? shippingAPI.update(initialData._id, data) : shippingAPI.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shipping'] }); onClose(); }
  });
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Shipping' : 'Add Shipping'}</DialogTitle>
      <DialogContent>
        <TextField label="Order ID" value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} fullWidth sx={{ mb: 2 }} />
        <TextField label="Carrier" value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} fullWidth sx={{ mb: 2 }} />
        <TextField label="Tracking Number" value={form.trackingNumber} onChange={e => setForm({ ...form, trackingNumber: e.target.value })} fullWidth sx={{ mb: 2 }} />
        <TextField label="Shipped Date" type="date" value={form.shippedDate?.slice(0,10) || ''} onChange={e => setForm({ ...form, shippedDate: e.target.value })} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
        <TextField label="Estimated Delivery" type="date" value={form.estimatedDelivery?.slice(0,10) || ''} onChange={e => setForm({ ...form, estimatedDelivery: e.target.value })} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
        <TextField label="Delivered Date" type="date" value={form.deliveredDate?.slice(0,10) || ''} onChange={e => setForm({ ...form, deliveredDate: e.target.value })} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select value={form.status} label="Status" onChange={e => setForm({ ...form, status: e.target.value })}>
            {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>Shipping Address</Typography>
        <Box display="flex" gap={2} sx={{ mb: 2 }}>
          <TextField label="Street" value={form.shippingAddress.street} onChange={e => setForm({ ...form, shippingAddress: { ...form.shippingAddress, street: e.target.value } })} sx={{ flex: 1 }} />
          <TextField label="City" value={form.shippingAddress.city} onChange={e => setForm({ ...form, shippingAddress: { ...form.shippingAddress, city: e.target.value } })} sx={{ flex: 1 }} />
          <TextField label="State" value={form.shippingAddress.state} onChange={e => setForm({ ...form, shippingAddress: { ...form.shippingAddress, state: e.target.value } })} sx={{ flex: 1 }} />
          <TextField label="Zip Code" value={form.shippingAddress.zipCode} onChange={e => setForm({ ...form, shippingAddress: { ...form.shippingAddress, zipCode: e.target.value } })} sx={{ flex: 1 }} />
          <TextField label="Country" value={form.shippingAddress.country} onChange={e => setForm({ ...form, shippingAddress: { ...form.shippingAddress, country: e.target.value } })} sx={{ flex: 1 }} />
        </Box>
        <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} fullWidth sx={{ mb: 2 }} />
        <TextField label="Cost" type="number" value={form.cost} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} fullWidth sx={{ mb: 2 }} />
        {mutation.isError && (
          <Typography color="error">
            {(() => {
              const err = mutation.error as any;
              if (err && err.response && err.response.data && err.response.data.message) {
                return err.response.data.message;
              }
              if (err && err.message) {
                return err.message;
              }
              return 'Error saving shipping record.';
            })()}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate(form)} variant="contained" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  );
};

const ShippingManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['shipping'],
    queryFn: async () => (await shippingAPI.getAll()).data
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => shippingAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipping'] })
  });

  // Filtered data based on search
  const filteredData = (data || []).filter((ship: any) => {
    const q = search.toLowerCase();
    const orderNumber = typeof ship.order === 'object' && ship.order?.orderNumber ? ship.order.orderNumber : '';
    return (
      orderNumber.toLowerCase().includes(q) ||
      ship.carrier?.toLowerCase().includes(q) ||
      ship.trackingNumber?.toLowerCase().includes(q) ||
      ship.status?.toLowerCase().includes(q) ||
      ship.shippingAddress?.city?.toLowerCase().includes(q) ||
      ship.shippingAddress?.country?.toLowerCase().includes(q)
    );
  });
// Status chip with color and icon
function getStatusProps(status: string) {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'warning' as const, icon: HourglassEmptyIcon };
    case 'shipped':
      return { label: 'Shipped', color: 'info' as const, icon: LocalShippingIcon };
    case 'in_transit':
      return { label: 'In Transit', color: 'primary' as const, icon: DirectionsTransitIcon };
    case 'delivered':
      return { label: 'Delivered', color: 'success' as const, icon: CheckCircleIcon };
    case 'cancelled':
      return { label: 'Cancelled', color: 'error' as const, icon: CancelIcon };
    default:
      return { label: status, color: 'default' as const, icon: undefined };
  }
}

function StatusChip({ status }: { status: string }) {
  const s = getStatusProps(status);
  const Icon = s.icon;
  return (
    <Chip
      icon={Icon ? <Icon fontSize="small" /> : undefined}
      label={s.label}
      color={s.color}
      size="small"
      sx={{ fontWeight: 500, minWidth: 100 }}
      variant={s.color === 'default' ? 'outlined' : 'filled'}
    />
  );
}
  // Metrics
  const totalShipments = filteredData.length;
  const statusCounts = filteredData.reduce((acc: Record<string, number>, ship: any) => {
    acc[ship.status] = (acc[ship.status] || 0) + 1;
    return acc;
  }, {});
  const totalCost = filteredData.reduce((sum: number, ship: any) => sum + (ship.cost || 0), 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Shipping Management</Typography>
        <Button variant="contained" onClick={() => { setOpen(true); setEditing(null); }}>Add Shipping</Button>
      </Box>

      {/* Metrics Summary */}
      <Box display="flex" gap={3} mb={2} flexWrap="wrap">
        {/* Total Shipments */}
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', alignItems: 'center', gap: 2 }} elevation={2}>
          <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: '50%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LocalShippingIcon />
          </Box>
          <Box>
            <Typography variant="subtitle2">Total Shipments</Typography>
            <Typography variant="h6">{totalShipments}</Typography>
          </Box>
        </Paper>
        {/* Total Cost */}
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', alignItems: 'center', gap: 2 }} elevation={2}>
          <Box sx={{ bgcolor: 'success.main', color: 'success.contrastText', borderRadius: '50%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleIcon />
          </Box>
          <Box>
            <Typography variant="subtitle2">Total Cost</Typography>
            <Typography variant="h6">₹{totalCost.toFixed(2)}</Typography>
          </Box>
        </Paper>
        {/* Merged Status Metrics */}
        <Paper sx={{ p: 2, minWidth: 340, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }} elevation={2}>
          {[
            { status: 'pending', icon: HourglassEmptyIcon, color: 'warning.main' },
            { status: 'shipped', icon: LocalShippingIcon, color: 'info.main' },
            { status: 'in_transit', icon: DirectionsTransitIcon, color: 'primary.main' },
            { status: 'delivered', icon: CheckCircleIcon, color: 'success.main' },
            { status: 'cancelled', icon: CancelIcon, color: 'error.main' },
          ].map(({ status, icon: Icon, color }) => (
            <Box key={status} display="flex" alignItems="center" gap={1}>
              <Box sx={{ bgcolor: color, color: '#fff', borderRadius: '50%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                <Icon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', fontSize: 13 }}>{status.replace('_',' ')}</Typography>
                <Typography variant="h6" sx={{ fontSize: 18 }}>{statusCounts[status] || 0}</Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>

      {/* Search Bar */}
      <Box mb={2} maxWidth={400}>
        <TextField
          label="Search Shipments"
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
          variant="outlined"
        />
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Carrier</TableCell>
              <TableCell>Tracking #</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Shipped</TableCell>
              <TableCell>Estimated Delivery</TableCell>
              <TableCell>Delivered</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9}><Box display="flex" justifyContent="center"><CircularProgress /></Box></TableCell></TableRow>
            ) : filteredData.map((ship: any) => (
              <TableRow key={ship._id}>
                <TableCell>{typeof ship.order === 'object' && ship.order?.orderNumber ? ship.order.orderNumber : ''}</TableCell>
                <TableCell>{ship.carrier}</TableCell>
                <TableCell>{ship.trackingNumber}</TableCell>
                <TableCell>
                  <StatusChip status={ship.status} />
                </TableCell>
                <TableCell>{ship.shippedDate ? new Date(ship.shippedDate).toLocaleDateString() : ''}</TableCell>
                <TableCell>{ship.estimatedDelivery ? new Date(ship.estimatedDelivery).toLocaleDateString() : ''}</TableCell>
                <TableCell>{ship.deliveredDate ? new Date(ship.deliveredDate).toLocaleDateString() : ''}</TableCell>
                <TableCell>₹{ship.cost?.toFixed(2)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => { setEditing(ship); setOpen(true); }} size="small"><EditIcon /></IconButton>
                  <IconButton onClick={() => deleteMutation.mutate(ship._id)} size="small" color="error"><DeleteIcon /></IconButton>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ShippingForm open={open} onClose={() => { setOpen(false); setEditing(null); }} initialData={editing} />
    </Box>
  );
};

export default ShippingManagement;
