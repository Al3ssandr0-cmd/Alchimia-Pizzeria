const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware per leggere il formato JSON e servire i file statici
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MENU_FILE = path.join(__dirname, 'menu.json');

// Rotta per leggere il menu
app.get('/api/menu', (req, res) => {
    fs.readFile(MENU_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nella lettura del menu.' });
        }
        res.json(JSON.parse(data));
    });
});

// Rotta per aggiornare il menu (aggiunta o modifica pizze)
app.post('/api/menu', (req, res) => {
    const newMenu = req.body;
    fs.writeFile(MENU_FILE, JSON.stringify(newMenu, null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel salvataggio del menu.' });
        }
        res.json({ success: true, message: 'Menu aggiornato con successo!' });
    });
});

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
