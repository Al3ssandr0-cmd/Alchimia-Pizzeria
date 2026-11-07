const express = require('express');
const fs = fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MENU_FILE = path.join(__dirname, 'menu.json');
const ORDINI_FILE = path.join(__dirname, 'ordini.json');

// Crea ordini.json se non esiste
if (!fs.existsSync(ORDINI_FILE)) {
    fs.writeFileSync(ORDINI_FILE, JSON.stringify([]));
}

// Rotta Menu
app.get('/api/menu', (req, res) => {
    fs.readFile(MENU_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Errore lettura menu' });
        res.json(JSON.parse(data));
    });
});

app.post('/api/menu', (req, res) => {
    fs.writeFile(MENU_FILE, JSON.stringify(req.body, null, 2), 'utf8', (err) => {
        if (err) return res.status(500).json({ error: 'Errore salvataggio menu' });
        res.json({ success: true });
    });
});

// Rotta Ordini (per Cucina e Asporto)
app.get('/api/ordini', (req, res) => {
    fs.readFile(ORDINI_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Errore lettura ordini' });
        res.json(JSON.parse(data));
    });
});

app.post('/api/ordini', (req, res) => {
    fs.readFile(ORDINI_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Errore lettura ordini' });
        const ordini = JSON.parse(data);
        const nuovoOrdine = { id: Date.now(), ...req.body, timestamp: new Date().toLocaleTimeString() };
        ordini.push(nuovoOrdine);
        
        fs.writeFile(ORDINI_FILE, JSON.stringify(ordini, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ error: 'Errore salvataggio ordine' });
            res.json({ success: true, ordine: nuovoOrdine });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
