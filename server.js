const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Rotta di pagamento simulata per sbloccare l'interfaccia e testare senza errori
app.post('/create-payment-intent', async (req, res) => {
    try {
        res.send({
            clientSecret: 'pi_test_secret_mock_' + Math.random().toString(36).substring(7)
        });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

io.on('connection', (socket) => {
    console.log('Un utente si è connesso:', socket.id);

    socket.on('nuovo_ordine', (orderData) => {
        console.log('Nuovo ordine ricevuto:', orderData);
        io.emit('nuovo_ordine', orderData);
    });

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
