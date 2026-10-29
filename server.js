const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Inizializziamo Stripe con una chiave di test valida di default se non usi le variabili d'ambiente
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51PxTESTKEY_SOSTITUISCI_CON_LA_TUA');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Rotta ufficiale per creare il pagamento con Stripe
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe vuole i centesimi (es. 10.00 € = 1000)
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

io.on('connection', (socket) => {
    socket.on('nuovo_ordine', (orderData) => {
        io.emit('nuovo_ordine', orderData);
    });

    socket.on('aggiorna_stato', (data) => {
        io.emit('aggiorna_stato_cliente', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
