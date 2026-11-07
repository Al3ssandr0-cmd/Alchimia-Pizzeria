const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Inizializzazione Socket.io con CORS totalmente aperto
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ORDINI_FILE = path.join(__dirname, 'ordini.json');

function leggiOrdini() {
  try {
    if (fs.existsSync(ORDINI_FILE)) {
      const data = fs.readFileSync(ORDINI_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Errore lettura ordini.json:', err);
  }
  return [];
}

function salvaOrdini(ordini) {
  try {
    fs.writeFileSync(ORDINI_FILE, JSON.stringify(ordini, null, 2), 'utf8');
  } catch (err) {
    console.error('Errore scrittura ordini.json:', err);
  }
}

io.on('connection', (socket) => {
  console.log('⚡ Un client si è connesso! ID:', socket.id);

  // Invia subito la lista ordini alla connessione
  socket.emit('lista_ordini', leggiOrdini());

  // Ricezione ordine da Menu o Asporto
  socket.on('nuovo_ordine', (orderData) => {
    console.log('📩 Nuovo ordine ricevuto:', orderData.id);
    
    const ordini = leggiOrdini();
    ordini.push(orderData);
    salvaOrdini(ordini);

    // Trasmette in tempo reale a TUTTI i client collegati (compresa Cucina)
    io.emit('nuovo_ordine', orderData);
  });

  // Aggiornamento stato dalla cucina
  socket.on('aggiorna_stato', ({ id, stato }) => {
    const ordini = leggiOrdini();
    const ordine = ordini.find(o => o.id === id);
    if (ordine) {
      ordine.stato = stato;
      salvaOrdini(ordini);
      io.emit('aggiorna_stato', { id, stato });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnesso:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server avviato correttamente sulla porta ${PORT}`);
});
