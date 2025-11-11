import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'
const socket = io(SERVER)

export default function Player(){
  const [roomCode, setRoomCode] = useState('')
  const [name, setName] = useState('')
  const [joined, setJoined] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [result, setResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    socket.on('game:question', ({ index, question, time }) => {
      setCurrentQuestion({ index, ...question, time })
      setResult(null)
    })
    socket.on('game:answer-result', ({ correctIndex, leaderboard }) => {
      setResult(correctIndex)
      setLeaderboard(leaderboard)
    })
    socket.on('game:over', ({ leaderboard }) => {
      setCurrentQuestion(null)
      setLeaderboard(leaderboard)
      alert('Game over — check leaderboard')
    })

    return () => socket.off()
  }, [])

  function joinRoom(){
    socket.emit('player:join', { roomCode, name }, (res) => {
      if (res.ok) setJoined(true)
      else alert(res.error || 'Could not join')
    })
  }

  function answer(i){
    if (!currentQuestion) return;
    socket.emit('player:answer', { roomCode, answerIndex: i }, (res) => {
      if (!res.ok) alert(res.error || 'Error')
      else setResult(res.correct ? 'correct' : 'wrong')
    })
  }

  return (
    <div className="player screen">
      {!joined ? (
        <div className="join">
          <h3>Join game</h3>
          <input placeholder="Room code" value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} />
          <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
          <button onClick={joinRoom}>Join</button>
        </div>
      ) : (
        <div>
          <p>Joined room: <strong>{roomCode}</strong> as <strong>{name}</strong></p>
          {!currentQuestion ? <p>Waiting for host...</p> : (
            <div>
              <h3>{currentQuestion.text}</h3>
              <ol>
                {currentQuestion.options.map((o,i)=>(
                  <li key={i}><button onClick={()=>answer(i)}>{o}</button></li>
                ))}
              </ol>
              {result && <p>Answer sent: {String(result)}</p>}
            </div>
          )}
          <h4>Leaderboard</h4>
          <ol>{leaderboard.map((p,i)=> <li key={i}>{p.name} — {p.score}</li>)}</ol>
        </div>
      )}
    </div>
  )
}
