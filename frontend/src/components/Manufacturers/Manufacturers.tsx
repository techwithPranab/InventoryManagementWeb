import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { manufacturersAPI } from '../../services/api';

const Manufacturers: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  const [form, setForm] = React.useState({ name: '', contactPerson: '', phone: '', email: '', website: '', notes: '' });

  const { data: manufacturers, isLoading } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: async () => (await manufacturersAPI.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => manufacturersAPI.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['manufacturers'] }); setOpen(false); setForm({ name: '', contactPerson: '', phone: '', email: '', website: '', notes: '' }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => manufacturersAPI.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['manufacturers'] }); setOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => manufacturersAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manufacturers'] }),
  });

  const handleEdit = (m: any) => { setEditing(m); setForm(m); setOpen(true); };
  const handleSubmit = () => {
    if (editing) updateMutation.mutate({ id: editing._id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Manufacturers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setOpen(true); setEditing(null); setForm({ name: '', contactPerson: '', phone: '', email: '', website: '', notes: '' }); }}>Add</Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Website</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {manufacturers?.map((m: any) => (
              <TableRow key={m._id}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.contactPerson}</TableCell>
                <TableCell>{m.phone}</TableCell>
                <TableCell>{m.email}</TableCell>
                <TableCell>
                  {m.address ? [m.address.street, m.address.city, m.address.state, m.address.zipCode, m.address.country].filter(Boolean).join(', ') : ''}
                </TableCell>
                <TableCell>{m.website}</TableCell>
                <TableCell>{m.notes}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(m)}><EditIcon /></IconButton>
                  <IconButton onClick={() => deleteMutation.mutate(m._id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editing ? 'Edit Manufacturer' : 'Add Manufacturer'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Contact Person" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Manufacturers;
