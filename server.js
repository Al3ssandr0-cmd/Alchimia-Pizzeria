const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve i file statici dalla cartella principale
app.use(express.static(path.join(__dirname)));

// Memoria temporanea degli ordini attivi
let listaOrdini = [];

io.on('connection', (socket) => {
  console.log('Un utente si è connesso:', socket.id);

  // Appena si connette qualcuno (es. la cucina), gli manda gli ordini attuali
  socket.emit('carica_ordini', listaOrdini);

  // Ricezione di un nuovo ordine (da menu.html o asporto.html)
  socket.on('nuovo_ordine', (ordine) => {
    console.log('Nuovo ordine ricevuto:', ordine);
    listaOrdini.push(ordine);

    // Invia l'ordine aggiornato a TUTTI (cucina inclusa)
    io.emit('nuovo_ordine_cucina', ordine);
  });

  socket.on('disconnect', () => {
    console.log('Utente disconnesso:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});
