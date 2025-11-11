import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'
const socket = io(SERVER)

export default function Host(){
  const [roomCode, setRoomCode] = useState(null)
  const [players, setPlayers] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [correctIndex, setCorrectIndex] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    socket.on('host:room-created', ({ roomCode }) => setRoomCode(roomCode))
    socket.on('room:update-players', (list) => setPlayers(list))
    socket.on('game:question', ({ index, question, time }) => {
      setCurrentQuestion({ index, ...question, time })
      setCorrectIndex(null)
    })
    socket.on('game:answer-result', ({ correctIndex, leaderboard }) => {
      setCorrectIndex(correctIndex)
      setLeaderboard(leaderboard)
    })
    socket.on('game:over', ({ leaderboard }) => {
      setCurrentQuestion(null)
      setLeaderboard(leaderboard)
      alert('Game over — check leaderboard')
    })
    socket.on('room:host-disconnected', () => alert('Host disconnected'))

    return () => socket.off()
  }, [])

  function createRoom(){
    socket.emit('host:create-room')
  }

  function startGame(){
    socket.emit('host:start-game', { roomCode })
  }

  function nextQuestion(){
    socket.emit('host:next-question', { roomCode })
  }

  return (
    <div className="host screen">
      <h2>Host Panel</h2>
      {!roomCode ? (
        <button onClick={createRoom}>Create room</button>
      ) : (
        <div>
          <p>Room code: <strong>{roomCode}</strong></p>
          <div className="players">
            <h3>Players</h3>
            <ul>{players.map((p,i)=> <li key={i}>{p.name} — {p.score}</li>)}</ul>
          </div>
          {!currentQuestion ? (
            <div>
              <button onClick={startGame}>Start game</button>
            </div>
          ) : (
            <div className="question-box">
              <h3>Q: {currentQuestion.text}</h3>
              <ol>
                {currentQuestion.options.map((o, i) => (
                  <li key={i}>{o} {correctIndex === i ? '✅' : ''}</li>
                ))}
              </ol>
              <p>Time: {currentQuestion.time}s</p>
              <button onClick={nextQuestion}>Next question</button>
              <h4>Leaderboard</h4>
              <ol>{leaderboard.map((p,i)=> <li key={i}>{p.name} — {p.score}</li>)}</ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
