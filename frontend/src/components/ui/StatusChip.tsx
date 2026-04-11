import { Chip } from '@mui/material';

interface StatusChipProps {
  status: 'activo' | 'inactivo';
}

export default function StatusChip({ status }: StatusChipProps): React.ReactElement {
  return (
    <Chip
      label={status === 'activo' ? 'Activo' : 'Inactivo'}
      color={status === 'activo' ? 'success' : 'default'}
      size="small"
    />
  );
}
