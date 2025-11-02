import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
// Status chip for Active/Inactive

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, MenuItem, Select, InputLabel, FormControl, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonIcon from '@mui/icons-material/Person';
import Avatar from '@mui/material/Avatar';
import { userAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
const roleOptions = ['admin', 'manager', 'staff'];
function StatusChip({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Box component="span" display="inline-flex" alignItems="center">
      <Box sx={{ bgcolor: 'success.main', color: 'success.contrastText', borderRadius: 1, px: 1, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <CheckCircleIcon fontSize="small" />
        <Typography variant="body2" fontWeight={500}>Active</Typography>
      </Box>
    </Box>
  ) : (
    <Box component="span" display="inline-flex" alignItems="center">
      <Box sx={{ bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 1, px: 1, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <CancelIcon fontSize="small" />
        <Typography variant="body2" fontWeight={500}>Inactive</Typography>
      </Box>
    </Box>
  );
}
const defaultForm = {
  name: '',
  email: '',
  password: '',
  role: 'staff',
  avatar: '',
  isActive: true
};

const UserForm = ({ open, onClose, initialData }: any) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(initialData?._id);
  const [form, setForm] = useState(initialData || defaultForm);
  React.useEffect(() => { if (open) setForm(initialData || defaultForm); }, [open, initialData]);
  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? userAPI.update(initialData._id, data) : userAPI.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); onClose(); }
  });
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
      <DialogContent>
        <TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth sx={{ mb: 2 }} />
        <TextField label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} fullWidth sx={{ mb: 2 }} />
        {!isEdit && <TextField label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} fullWidth sx={{ mb: 2 }} />}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Role</InputLabel>
          <Select value={form.role} label="Role" onChange={e => setForm({ ...form, role: e.target.value })}>
            {roleOptions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Avatar URL" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} fullWidth sx={{ mb: 2 }} />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Active</InputLabel>
          <Select value={form.isActive ? 'true' : 'false'} label="Active" onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
        </FormControl>
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
              return 'Error saving user.';
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



const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const { user } = useAuth();

  // Fetch all users if admin, else fetch only self
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', user?.role],
    queryFn: async () => {
      if (user?.role === 'admin') {
        const res = await userAPI.getAll();
        // Ensure _id is present for each user
        return (res.data || []).map((u: any) => ({ ...u, _id: u._id || u.id }));
      } else if (user) {
        return [{ ...user, _id: user.id }];
      } else {
        return [];
      }
    },
    enabled: !!user
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', user?.role] })
  });

  // Metrics
  const totalUsers = (data && data.length) || 0;
  const activeUsers = (data && data.filter((u: any) => u.isActive).length) || 0;
  const adminCount = (data && data.filter((u: any) => u.role === 'admin').length) || 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">User Management</Typography>
        {user?.role === 'admin' && (
          <Button variant="contained" onClick={() => { setOpen(true); setEditing(null); }}>Add User</Button>
        )}
      </Box>

      {/* Metrics Summary */}
      {user?.role === 'admin' && (
        <Box display="flex" gap={3} mb={2} flexWrap="wrap">
          <Paper sx={{ p: 2, minWidth: 160, display: 'flex', alignItems: 'center', gap: 2 }} elevation={2}>
            <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: '50%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PeopleIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2">Total Users</Typography>
              <Typography variant="h6">{totalUsers}</Typography>
            </Box>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 160, display: 'flex', alignItems: 'center', gap: 2 }} elevation={2}>
            <Box sx={{ bgcolor: 'success.main', color: 'success.contrastText', borderRadius: '50%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VerifiedUserIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2">Active Users</Typography>
              <Typography variant="h6">{activeUsers}</Typography>
            </Box>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 160, display: 'flex', alignItems: 'center', gap: 2 }} elevation={2}>
            <Box sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', borderRadius: '50%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PersonIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2">Admins</Typography>
              <Typography variant="h6">{adminCount}</Typography>
            </Box>
          </Paper>
        </Box>
      )}

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Avatar</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Active</TableCell>
              {user?.role === 'admin' && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={user?.role === 'admin' ? 6 : 5}><Box display="flex" justifyContent="center"><CircularProgress /></Box></TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={user?.role === 'admin' ? 6 : 5} style={{ color: 'red' }}>{(error as any)?.response?.data?.message || (error as any)?.message || 'Error loading users.'}</TableCell></TableRow>
            ) : (data && data.length > 0) ? (
              (data || []).map((userRow: any) => (
                <TableRow key={userRow._id}>
                  <TableCell>
                    {userRow.avatar ? (
                      <Avatar src={userRow.avatar} alt={userRow.name} />
                    ) : (
                      <Avatar><PersonIcon /></Avatar>
                    )}
                  </TableCell>
                  <TableCell>{userRow.name}</TableCell>
                  <TableCell>{userRow.email}</TableCell>
                  <TableCell>{userRow.role}</TableCell>
                  <TableCell><StatusChip isActive={userRow.isActive} /></TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>
                      <IconButton onClick={() => { setEditing(userRow); setOpen(true); }} size="small"><EditIcon /></IconButton>
                      <IconButton onClick={() => deleteMutation.mutate(userRow._id)} size="small" color="error"><DeleteIcon /></IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={user?.role === 'admin' ? 6 : 5} style={{ color: '#888' }}>No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <UserForm open={open} onClose={() => { setOpen(false); setEditing(null); }} initialData={editing} />
    </Box>
  );
};

export default UserManagement;
