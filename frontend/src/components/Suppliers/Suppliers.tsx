import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { suppliersAPI } from '../../services/api';

const Suppliers: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  const [form, setForm] = React.useState({ name: '', contactPerson: '', phone: '', email: '', website: '', notes: '' });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await suppliersAPI.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => suppliersAPI.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setOpen(false); setForm({ name: '', contactPerson: '', phone: '', email: '', website: '', notes: '' }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => suppliersAPI.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });

  const handleEdit = (s: any) => { setEditing(s); setForm(s); setOpen(true); };
  const handleSubmit = () => {
    if (editing) updateMutation.mutate({ id: editing._id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Suppliers</Typography>
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
              <TableCell>Website</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers?.map((s: any) => (
              <TableRow key={s._id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.contactPerson}</TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{s.website}</TableCell>
                <TableCell>{s.notes}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(s)}><EditIcon /></IconButton>
                  <IconButton onClick={() => deleteMutation.mutate(s._id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
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

export default Suppliers;
