import { Button, IconButton, Tooltip } from '@mui/material';
import { Chat } from '@mui/icons-material';

interface WhatsAppButtonProps {
  phone: string;
  message: string;
  variant?: 'icon' | 'button';
  label?: string;
}

export default function WhatsAppButton({ phone, message, variant = 'button', label = 'WhatsApp' }: WhatsAppButtonProps): React.ReactElement | null {
  if (!phone) return null;

  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  const handleClick = () => window.open(url, '_blank');

  if (variant === 'icon') {
    return (
      <Tooltip title="Enviar por WhatsApp">
        <IconButton onClick={handleClick} sx={{ color: '#25d366' }} size="small">
          <Chat />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="outlined"
      startIcon={<Chat />}
      onClick={handleClick}
      sx={{ color: '#25d366', borderColor: '#25d366', '&:hover': { borderColor: '#1da851', bgcolor: 'rgba(37,211,102,0.04)' } }}
    >
      {label}
    </Button>
  );
}
