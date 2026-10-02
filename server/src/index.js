import express from 'express';

const app = express();
const PORT = 3000;

// Permite que el servidor entienda datos en formato JSON
app.use(express.json());

//Endpoint de salud: sirve para saber si el servidor está vivo
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});