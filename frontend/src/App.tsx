import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, Typography, Container } from '@mui/material';

function HomePage(): React.ReactElement {
  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 10 }}>
      <Typography variant="h3" component="h1" gutterBottom color="primary">
        cafe-pos
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Sistema de inventario, punto de venta y gestión de créditos
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Setup completo. Próximo paso: Auth + Roles
        </Typography>
      </Box>
    </Container>
  );
}

function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* TODO(setup): Add module routes */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/productos" element={<ProductsPage />} /> */}
        {/* <Route path="/pos" element={<PosPage />} /> */}
        {/* <Route path="/creditos" element={<CreditsPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
