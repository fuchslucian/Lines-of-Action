import { Link } from "react-router-dom";
import React, { useState } from 'react'


const randomCodeGenerator = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let code = ""
    for (let i = 0; i < 8; i++){
        code += characters.charAt(Math.floor(Math.random() * 62))
    }
    return code
}

const Homepage = () => {
    const [roomCode, setRoomCode] = useState('')

    return (
        <>
        <div className="homepage">
            <div>
                <input value={roomCode} className="gamecode" type='text' placeholder='Game Code' onChange={(event) => {
                    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
                    if (!characters.includes(event.target.value.slice(-1))){
                        event.preventDefault()
                    }else{
                        setRoomCode(event.target.value)}}
                    }/>
                    <Link to={`/game?roomCode=${roomCode}`}>
                        <button className="gamecode" onClick={(event) => {
                            if (roomCode.length !== 8){
                                event.preventDefault()
                            }
                            }}>JOIN GAME</button>
                    </Link>
            </div>
            <h1>OR</h1>
            <div>
                <Link to={`/game?roomCode=${randomCodeGenerator()}`}><button className="gamecode">CREATE GAME</button></Link>
            </div>
        </div>
        </>
    )
}

 
export default Homepage;