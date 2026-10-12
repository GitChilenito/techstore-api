const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db/pool');

const app = express();
app.use(express.json());
app.use(cors());

// CREATE - Registrar un cliente (Seguro con parámetros)
app.post('/api/clientes', async (req, res) => {
    try {
        const { nombre, email, telefono } = req.body;
        
        if (!nombre || !email) {
            return res.status(400).json({ error: 'El nombre y el email son obligatorios.' });
        }

        const query = `INSERT INTO cliente (nombre, email, telefono) VALUES ($1, $2, $3) RETURNING *`;
        const values = [nombre, email, telefono];
        
        const newClient = await pool.query(query, values);
        res.status(201).json(newClient.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'El correo electrónico ya se encuentra registrado.' });
        }
        res.status(500).json({ error: error.message });
    }
});

// READ - Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const allClients = await pool.query('SELECT * FROM cliente ORDER BY id_cliente ASC');
        res.status(200).json(allClients.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// READ - Obtener un cliente por ID
app.get('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await pool.query('SELECT * FROM cliente WHERE id_cliente = $1', [id]);
        
        if (client.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }
        res.status(200).json(client.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE - Actualizar un cliente
app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, telefono } = req.body;

        const query = `UPDATE cliente SET nombre = $1, email = $2, telefono = $3 WHERE id_cliente = $4 RETURNING *`;
        const values = [nombre, email, telefono, id];

        const updatedClient = await pool.query(query, values);

        if (updatedClient.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado para actualizar.' });
        }

        res.status(200).json(updatedClient.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'El correo electrónico ya está en uso por otro cliente.' });
        }
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Eliminar un cliente
app.delete('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteClient = await pool.query('DELETE FROM cliente WHERE id_cliente = $1 RETURNING *', [id]);

        if (deleteClient.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado para eliminar.' });
        }

        res.status(200).json({ message: 'Cliente eliminado exitosamente', client: deleteClient.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});