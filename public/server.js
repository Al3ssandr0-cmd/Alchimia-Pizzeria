const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware per leggere i dati inviati in formato JSON
app.use(express.json());

// Rende pubblici i file che metti nella cartella "public" (es. admin.html)
app.use(express.static(path.join(__dirname, 'public')));

// 1. API Pubblica: restituisce solo i prodotti con "attivo: true" per i clienti
app.get('/api/menu', (req, res) => {
    fs.readFile('menu.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ errore: "Impossibile leggere il menu." });
        }
        try {
            const menu = JSON.parse(data);
            const menuAttivo = menu.filter(item => item.attivo === true);
            res.json(menuAttivo);
        } catch (parseErr) {
            res.status(500).json({ errore: "Errore nel formato del file menu.json" });
        }
    });
});

// 2. API Admin: restituisce TUTTO il menu (attivi e non) per il pannello di gestione
app.get('/api/admin/menu', (req, res) => {
    fs.readFile('menu.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ errore: "Impossibile leggere il menu." });
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseErr) {
            res.status(500).json({ errore: "Errore nel formato del file menu.json" });
        }
    });
});

// 3. API Admin: Aggiunge un nuovo prodotto al menu
app.post('/api/admin/prodotto', (req, res) => {
    fs.readFile('menu.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ errore: "Impossibile leggere il menu." });
        }
        
        try {
            const menu = JSON.parse(data);
            
            const nuovoProdotto = {
                id: Date.now().toString(), // Genera un ID univoco basato sull'orario
                nome: req.body.nome,
                ingredienti: req.body.ingredienti,
                prezzo: parseFloat(req.body.prezzo),
                categoria: req.body.categoria || "Le Speciali",
                attivo: true
            };

            menu.push(nuovoProdotto);

            fs.writeFile('menu.json', JSON.stringify(menu, null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ errore: "Impossibile salvare il nuovo prodotto." });
                }
                res.json({ successo: true, prodotto: nuovoProdotto });
            });
        } catch (parseErr) {
            res.status(500).json({ errore: "Errore nel formato del file menu.json" });
        }
    });
});

// 4. API Admin: Inverte lo stato (ON/OFF) di un prodotto tramite il suo ID
app.patch('/api/admin/toggle/:id', (req, res) => {
    const idDaModificare = req.params.id;

    fs.readFile('menu.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ errore: "Impossibile leggere il menu." });
        }

        try {
            let menu = JSON.parse(data);
            let trovato = false;

            menu = menu.map(item => {
                if (item.id === idDaModificare) {
                    item.attivo = !item.attivo; // Inverte true/false
                    trovato = true;
                }
                return item;
            });

            if (!trovato) {
                return res.status(404).json({ errore: "Prodotto non trovato." });
            }

            fs.writeFile('menu.json', JSON.stringify(menu, null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ errore: "Impossibile aggiornare lo stato." });
                }
                res.json({ successo: true });
            });
        } catch (parseErr) {
            res.status(500).json({ errore: "Errore nel formato del file menu.json" });
        }
    });
});

// Avvia il server sulla porta indicata
app.listen(PORT, () => {
    console.log(`Server avviato con successo sulla porta ${PORT} 🍕`);
    console.log(`Pannello Admin disponibile su: http://localhost:${PORT}/admin.html`);
});