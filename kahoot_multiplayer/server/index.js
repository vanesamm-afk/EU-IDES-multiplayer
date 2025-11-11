// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

const QUESTIONS = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8'));

const rooms = {};

function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('host:create-room', () => {
    let code;
    do { code = makeRoomCode(); } while (rooms[code]);
    rooms[code] = {
      hostId: socket.id,
      players: {},
      questionIndex: -1,
      started: false
    };
    socket.join(code);
    socket.emit('host:room-created', { roomCode: code });
    console.log('room created', code);
  });

  socket.on('player:join', ({ roomCode, name }, cb) => {
    const room = rooms[roomCode];
    if (!room) return cb({ ok: false, error: 'Room not found' });
    room.players[socket.id] = { name, score: 0, answered: false };
    socket.join(roomCode);
    cb({ ok: true });
    io.to(room.hostId).emit('host:player-joined', { id: socket.id, name });
    io.in(roomCode).emit('room:update-players', Object.values(room.players).map(p => ({ name: p.name, score: p.score })));
    console.log(`${name} joined ${roomCode}`);
  });

  socket.on('host:start-game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;
    room.started = true;
    room.questionIndex = 0;
    const q = QUESTIONS[room.questionIndex];
    io.in(roomCode).emit('game:question', { index: room.questionIndex, question: { text: q.text, options: q.options }, time: 15 });
  });

  socket.on('host:next-question', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;
    room.questionIndex++;
    if (room.questionIndex >= QUESTIONS.length) {
      const leaderboard = Object.values(room.players).map(p => ({ name: p.name, score: p.score })).sort((a,b)=>b.score-a.score);
      io.in(roomCode).emit('game:over', { leaderboard });
      delete rooms[roomCode];
      return;
    }
    Object.values(room.players).forEach(p => p.answered = false);
    const q = QUESTIONS[room.questionIndex];
    io.in(roomCode).emit('game:question', { index: room.questionIndex, question: { text: q.text, options: q.options }, time: 15 });
  });

  socket.on('player:answer', ({ roomCode, answerIndex }, cb) => {
    const room = rooms[roomCode];
    if (!room) return cb && cb({ ok: false, error: 'Room not found' });
    const player = room.players[socket.id];
    if (!player) return cb && cb({ ok: false, error: 'Player not in room' });
    if (player.answered) return cb && cb({ ok: false, error: 'Already answered' });
    player.answered = true;
    const q = QUESTIONS[room.questionIndex];
    const correct = q.correct === answerIndex;
    if (correct) player.score += 100;
    cb && cb({ ok: true, correct });

    const allAnswered = Object.values(room.players).every(p => p.answered || false);
    if (allAnswered) {
      const leaderboard = Object.values(room.players).map(p => ({ name: p.name, score: p.score })).sort((a,b)=>b.score-a.score);
      io.in(roomCode).emit('game:answer-result', { correctIndex: q.correct, leaderboard });
    }
  });

  socket.on('disconnect', () => {
    for (const [code, room] of Object.entries(rooms)) {
      if (room.hostId === socket.id) {
        io.in(code).emit('room:host-disconnected');
        delete rooms[code];
        console.log('host disconnected, room closed', code);
        break;
      }
      if (room.players[socket.id]) {
        const name = room.players[socket.id].name;
        delete room.players[socket.id];
        io.in(code).emit('room:update-players', Object.values(room.players).map(p => ({ name: p.name, score: p.score })));
        io.to(room.hostId).emit('host:player-left', { id: socket.id, name });
        console.log(`${name} left room ${code}`);
        break;
      }
    }
  });
});

server.listen(PORT, () => console.log('Server listening on', PORT));
