const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// INIZIALIZZAZIONE STRIPE
// Inseriamo una chiave di prova (TEST) generica. 
// Quando il proprietario ti fornirà la sua chiave segreta reale (sk_live_...), 
// dovrai solo sostituire la stringa qui sotto.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51PxTESTKEY_SOSTITUISCI_CON_LA_TUA';
const stripe = require('stripe')(STRIPE_SECRET_KEY);

app.use(express.json());
app.use(express.static(__dirname));

// ROTTA PER CREARE IL PAGAMENTO ONLINE CON STRIPE
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount } = req.body; // Importo in Euro (es. 18.50)

        // Stripe lavora in centesimi di Euro (es. 18.50€ -> 1850 centesimi)
        const amountInCents = Math.round(parseFloat(amount) * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
        });

        // Invia il clientSecret al client per completare la transazione sicura
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Errore durante la creazione del PaymentIntent:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// GESTIONE SOCKET.IO PER L'INVIO DEGLI ORDINI IN CUCINA
io.on('connection', (socket) => {
    console.log('Un utente/dispositivo si è connesso');

    socket.on('nuovo-ordine', (ordine) => {
        // Invia l'ordine in tempo reale al tablet/schermo della cucina
        io.emit('ricevi-ordine', ordine);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server avviato e in ascolto sulla porta ${PORT}`);
});
