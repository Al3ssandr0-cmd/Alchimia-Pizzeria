const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const stripe = require('stripe')('sk_test_51PxTESTKEY_SOSTITUISCI_CON_LA_TUA');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(express.static(__dirname));

// Memoria temporanea del server per salvare gli ordini della giornata
let listaOrdini = [];

// API per creare il pagamento Stripe (Modalità simulazione/test)
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    
    // In modalità simulazione restituiamo un token fittizio per permettere il test della UI
    res.json({ clientSecret: 'pi_simulazione_secret_test_123456789' });
  } catch (error) {
    console.error("Errore Intent:", error);
    res.status(500).json({ error: error.message });
  }
});

// Gestione connessioni Socket.io per la Cucina e i Clienti
io.on('connection', (socket) => {
  console.log('⚡ Nuovo dispositivo connesso:', socket.id);

  // Invia subito tutti gli ordini registrati finora alla cucina appena si connette
  socket.emit('carica_ordini_esistenti', listaOrdini);

  // Quando un cliente invia un nuovo ordine (Asporto o Domicilio)
  socket.on('nuovo_ordine', (orderData) => {
    console.log('📦 Nuovo ordine ricevuto:', orderData.id);
    
    // Impostiamo lo stato iniziale se non è presente
    if (!orderData.stato) {
      orderData.stato = 'In attesa di conferma';
    }

    // Salva l'ordine nella memoria del server
    listaOrdini.push(orderData);

    // Trasmette l'ordine a tutti i dispositivi connessi (inclusa la Cucina)
    io.emit('nuovo_ordine', orderData);
  });

  // Quando la cucina aggiorna lo stato dell'ordine (es. "In preparazione", "Pronto")
  socket.on('aggiorna_stato', (data) => {
    const ordine = listaOrdini.find(o => o.id === data.orderId);
    if (ordine) {
      ordine.stato = data.status;
    }
    // Avvisa il cliente sul cambio di stato dell'ordine
    io.emit('aggiorna_stato_cliente', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Dispositivo disconnesso:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server in esecuzione sulla porta ${PORT}`);
});
