const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware per leggere i dati JSON inviati dal frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve i file statici dalla cartella corrente (asporto.html, ecc.)
app.use(express.static(path.join(__dirname)));

// Rotta di simulazione pagamento Stripe (per testare senza chiavi reali)
app.post('/create-payment-intent', async (req, res) => {
    try {
        // Restituisce un token fittizio per permettere il test immediato a domicilio
        res.send({
            clientSecret: 'pi_test_secret_mock_123456789'
        });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Gestione della connessione in tempo reale con Socket.io (Cucina e Clienti)
io.on('connection', (socket) => {
    console.log('Un utente si è connesso:', socket.id);

    // Ricezione di un nuovo ordine dal cliente
    socket.on('nuovo_ordine', (orderData) => {
        console.log('Nuovo ordine ricevuto:', orderData);
        // Invia l'ordine a tutti i dispositivi connessi (es. la schermata della cucina)
        io.emit('nuovo_ordine', orderData);
    });

    // Aggiornamento dello stato dell'ordine inviato dalla cucina al cliente
    socket.on('aggiorna_stato', (data) => {
        io.emit('aggiorna_stato_cliente', data);
    });

    socket.on('disconnect', () => {
        console.log('Un utente si è disconnesso:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
