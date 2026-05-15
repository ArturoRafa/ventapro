import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, Switch, FormControlLabel, Divider,
} from '@mui/material';
import type { BusinessConfig } from '../types/config.types';
import * as configService from '../services/config.service';
import { useConfig } from '../context/ConfigContext';
import { useSnackbar } from '../context/SnackbarContext';

export default function ConfigPage(): React.ReactElement {
  const { config, refetch } = useConfig();
  const { showSnackbar } = useSnackbar();
  const [form, setForm] = useState<Partial<BusinessConfig>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config) setForm({ ...config });
  }, [config]);

  const handleSave = async (): Promise<void> => {
    setLoading(true);
    try {
      await configService.updateConfig(form);
      await refetch();
      showSnackbar('Configuración actualizada');
    } catch {
      showSnackbar('Error al actualizar configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof BusinessConfig, value: unknown): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (!config) return <Typography>Cargando configuración...</Typography>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Configuración del Negocio</Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Identidad</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nombre del negocio" value={form.businessName ?? ''} onChange={(e) => updateField('businessName', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="URL del logo" value={form.logoUrl ?? ''} onChange={(e) => updateField('logoUrl', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Teléfono" value={form.businessPhone ?? ''} onChange={(e) => updateField('businessPhone', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Dirección" value={form.businessAddress ?? ''} onChange={(e) => updateField('businessAddress', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth label="Color primario" value={form.primaryColor ?? ''} onChange={(e) => updateField('primaryColor', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth label="Color secundario" value={form.secondaryColor ?? ''} onChange={(e) => updateField('secondaryColor', e.target.value)} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>Localización</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth label="Moneda" value={form.currency ?? ''} onChange={(e) => updateField('currency', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth label="Símbolo" value={form.currencySymbol ?? ''} onChange={(e) => updateField('currencySymbol', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth label="Impuesto (%)" type="number" value={form.taxPercentage ?? 0} onChange={(e) => updateField('taxPercentage', Number(e.target.value))} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>Módulos</Typography>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={form.usesCredit ?? false} onChange={(e) => updateField('usesCredit', e.target.checked)} />} label="Fiado / Créditos" /></Grid>
          <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={form.usesFood ?? false} onChange={(e) => updateField('usesFood', e.target.checked)} />} label="Comidas (sin stock)" /></Grid>
          <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={form.usesCashRegister ?? false} onChange={(e) => updateField('usesCashRegister', e.target.checked)} />} label="Control de caja" /></Grid>
          <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={form.usesWhatsapp ?? false} onChange={(e) => updateField('usesWhatsapp', e.target.checked)} />} label="WhatsApp" /></Grid>
          <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={form.usesReports ?? false} onChange={(e) => updateField('usesReports', e.target.checked)} />} label="Reportes" /></Grid>
          <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={form.usesTicketsPdf ?? false} onChange={(e) => updateField('usesTicketsPdf', e.target.checked)} />} label="Tickets PDF" /></Grid>
          <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={form.requiresOpeningAmount ?? false} onChange={(e) => updateField('requiresOpeningAmount', e.target.checked)} />} label="Requiere monto de apertura" /></Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Button variant="contained" size="large" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
