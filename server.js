const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Inizializzazione Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

// Serve i file HTML direttamente dalla radice principale (__dirname)
app.use(express.static(__dirname));

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
  console.log('⚡ Client connesso:', socket.id);

  // Invia gli ordini alla connessione (es. monitor cucina)
  socket.emit('lista_ordini', leggiOrdini());

  // Ricezione ordine da menu.html o asporto.html
  socket.on('nuovo_ordine', (orderData) => {
    console.log('📩 Ordine ricevuto:', orderData.id);
    
    const ordini = leggiOrdini();
    ordini.push(orderData);
    salvaOrdini(ordini);

    // Inoltra l'ordine a tutti (cucina inclusa)
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
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
