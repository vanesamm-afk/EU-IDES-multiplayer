import React, { useState } from 'react'
import Host from './Host'
import Player from './Player'

export default function App(){
  const [role, setRole] = useState(null)
  return (
    <div className="app">
      {!role ? (
        <div className="chooser">
          <h1>Kahoot-like Multiplayer (Demo)</h1>
          <div className="buttons">
            <button onClick={() => setRole('host')}>Host</button>
            <button onClick={() => setRole('player')}>Player</button>
          </div>
        </div>
      ) : role === 'host' ? (
        <Host />
      ) : (
        <Player />
      )}
    </div>
  )
}
