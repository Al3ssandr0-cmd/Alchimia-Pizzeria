const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'menu.html'));
});

app.get('/asporto', (req, res) => {
  res.sendFile(path.join(__dirname, 'asporto.html'));
});

app.get('/cucina', (req, res) => {
  res.sendFile(path.join(__dirname, 'cucina.html'));
});

io.on('connection', (socket) => {
  console.log('Nuovo dispositivo connesso:', socket.id);

  socket.on('nuovo_ordine', (orderData) => {
    console.log('Ricevuto nuovo ordine:', orderData.id, 'da', orderData.table);
    io.emit('nuovo_ordine_cucina', orderData);
  });

  socket.on('aggiorna_stato', (data) => {
    console.log(`Stato ordine ${data.id} aggiornato a: ${data.status}`);
    io.emit('aggiorna_stato_cliente', data);
  });

  socket.on('disconnect', () => {
    console.log('Dispositivo disconnesso:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server in esecuzione sulla porta ${PORT}`);
});