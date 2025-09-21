import express from 'express';
import pool from './db.js';

const router = express.Router();



// GET all items
router.get('/', async (req, res) => {
    const limit = parseInt(req.query.limit);
    console.log('REQ METHOD:', req.method);

    try {
        const [rows] = await pool.query(
            limit > 0 
            ? 'SELECT * FROM inventory LIMIT ?' 
            : 'SELECT * FROM inventory', 
            limit > 0 ? [limit] : []
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// GET single item
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    console.log('REQ METHOD:', req.method);
    try {
        const [rows] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ message: 'Item not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// POST add new item
router.post('/', async (req, res) => {
    const { id,name, stock } = req.body;
    console.log('REQ METHOD:', req.method);
    console.log('REQ BODY:', req.body);

    if (!id || !name || stock === undefined) return res.status(400).json({ message: 'Missing fields' });

    try {
        const [result] = await pool.query(
            'INSERT INTO inventory (id, name, stock) VALUES (?, ? , ?)',
            [id, name, stock]
        );

        res.status(201).json({ id, name, stock });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'ID already exists. Please choose another.' });
        }
        res.status(500).json({ message: 'Database error' });
    }
});


// PUT update item
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, stock } = req.body;
    console.log('REQ METHOD:', req.method);
    console.log('REQ BODY:', req.body);

    try {
        const [result] = await pool.query(
            'UPDATE inventory SET name = ?, stock = ? WHERE id = ?',
            [name, stock, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Item not found' });

        const [rows] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// DELETE item
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    console.log('REQ METHOD:', req.method);
    try {
        const [rows] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ message: 'Item not found' });

        await pool.query('DELETE FROM inventory WHERE id = ?', [id]);
        res.json({ message: 'Item deleted successfully', item: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// POST purchase item
router.post('/purchase/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    console.log('REQ METHOD:', req.method);
    console.log('REQ BODY:', req.body);

    if (!quantity || quantity <= 0) return res.status(400).json({ message: 'Invalid quantity' });

    try {
        const [rows] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ message: 'Item not found' });

        const item = rows[0];
        if (item.stock < quantity) return res.status(400).json({ message: 'Not enough stock' });

        await pool.query('UPDATE inventory SET stock = stock - ? WHERE id = ?', [quantity, id]);

        const [updatedRows] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
        res.json({ message: `Purchased ${quantity} of ${updatedRows[0].name}`, item: updatedRows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

export default router;
