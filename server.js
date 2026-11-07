const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ORDINI_FILE = path.join(__dirname, 'ordini.json');

// Funzione per leggere gli ordini salvati
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

// Funzione per salvare gli ordini
function salvaOrdini(ordini) {
  try {
    fs.writeFileSync(ORDINI_FILE, JSON.stringify(ordini, null, 2), 'utf8');
  } catch (err) {
    console.error('Errore scrittura ordini.json:', err);
  }
}

io.on('connection', (socket) => {
  console.log('Un client si è connesso:', socket.id);

  // Invia gli ordini esistenti appena un client si connette (es. la cucina)
  socket.emit('lista_ordini', leggiOrdini());

  // Ricezione di un nuovo ordine da menu.html o asporto.html
  socket.on('nuovo_ordine', (orderData) => {
    console.log('Nuovo ordine ricevuto:', orderData.id);
    
    const ordini = leggiOrdini();
    ordini.push(orderData);
    salvaOrdini(ordini);

    // Inoltra l'ordine in tempo reale a tutti i client collegati (Cucina)
    io.emit('nuovo_ordine', orderData);
  });

  // Gestione aggiornamento stato ordine dalla cucina
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
    console.log('Client disconnesso:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server Pizzeria Alchimia avviato sulla porta ${PORT}`);
});
