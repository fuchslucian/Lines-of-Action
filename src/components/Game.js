import React, { useState, useEffect } from 'react'
import io from "socket.io-client";


let socket

class Piece{
    constructor(row, col, legal_moves, color){
        this.row = row; 
        this.col = col;
        this.legal_moves = legal_moves;
        this.color = color
    }
}
const START_BOARD = [["",new Piece(0,1,[], "white"),new Piece(0,2,[], "white"),new Piece(0,3,[], "white"),new Piece(0,4,[], "white"),new Piece(0,5,[], "white"),new Piece(0,6,[], "white"),""],
                    [new Piece(1,0,[], "black"),"","","","","","",new Piece(1,7,[], "black")],
                    [new Piece(2,0,[], "black"),"","","","","","",new Piece(2,7,[], "black")],
                    [new Piece(3,0,[], "black"),"","","","","","",new Piece(3,7,[], "black")],
                    [new Piece(4,0,[], "black"),"","","","","","",new Piece(4,7,[], "black")],
                    [new Piece(5,0,[], "black"),"","","","","","",new Piece(5,7,[], "black")],
                    [new Piece(6,0,[], "black"),"","","","","","",new Piece(6,7,[], "black")],
                    ["",new Piece(7,1,[], "white"),new Piece(7,2,[], "white"),new Piece(7,3,[], "white"),new Piece(7,4,[], "white"),new Piece(7,5,[], "white"),new Piece(7,6,[], "white"),""]
                    ]

const Game = (props) => {
    const roomCode = window.location.search.substring(10)

    const [role, setRole] = useState("")
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState([])
    const [roomFull, setRoomFull] = useState(false)
    const [winner, setWinner] = useState("")
    const [board, setBoard] = useState(START_BOARD)
    const [player, setPlayer] = useState("")
    const [selected, setSelected] = useState([-1,-1])

    useEffect(() => {
        socket = io.connect("https://lineofactionbackend.onrender.com");
        socket.emit("join_room", roomCode);
        
    },[])


    useEffect(() => {

        socket.on("room_full", () => {
            setRoomFull(true)
        });

        // get role => white or black
        socket.on("receive_role", (data) => {
            setRole(data)
        });

        // start the game
        socket.on("start_game", () => {
            if (role === "black"){
                updateLegalMoves(board)
            }
            setPlayer("black")
        })

        // get new room data and update current
        socket.on("update_room_data", ({player, selected, board}) => {
            //setBoard(board)
            setSelected(selected)
            setPlayer(player)
            if (player === role){
                updateLegalMoves(board)
            }
        })

        socket.on("get_winner", ({roomCode, board, selected, player, winner, won_through_disconnect}) => {
            setPlayer(player)
            setSelected([-1,-1])
            if (typeof winner !== 'undefined'){
                setWinner(winner === role ? "You won" : "You Lost")
                if (winner === "draw"){
                    setWinner("It was a draw")
                }
            }
            if (won_through_disconnect){
                setWinner("Opponent disconnected, you won")
            }
            setTimeout(() => {
                document.getElementById("quit").click()
            }, 15000)
        })

        socket.on("get_message", (roomData) => {
            setMessages(roomData.messages)
        })

      },[socket]);


      const countPieces = (direction, row, col, board) => {
        // count pieces on direction line
        let count = 0
        let i = row
        let y = col
        while (i >= 0 && i < 8 && y >= 0 && y < 8){
            if (board[i][y] !== ""){
                count += 1
            }
            i += direction[0]
            y += direction[1]
        }
        i = row
        y = col
        while (i >= 0 && i < 8 && y >= 0 && y < 8){
            if (board[i][y] !== ""){
                count += 1
            }
            i -= direction[0]
            y -= direction[1]
        }
        return count-1

      }

      const checkMoveIsLegal = (count, row, col, direction, board) => {
        while (count > 1){
            row += direction[0]
            col += direction[1]
            count -= 1
            if (row < 0 || row >= 8 || col < 0 || col >= 8){
                return false
            }
            if (board[row][col] !== "" && board[row][col].color !== role){
                return false
            }
        }
        row += direction[0]
        col += direction[1]
        if (row < 0 || row >= 8 || col < 0 || col >= 8){
            return false
        }
        if (board[row][col] !== "" && board[row][col].color === role){
            return false
        }
        return true

      }
      const updateLegalMoves = (board) => {
        // iterates over all pieces in board
        for (let i = 0; i < board.length; i++) {
            for (let y = 0; y < board[i].length; y++) {
                // if there is no piece or the piece is from the enemy we continue
                if (board[i][y] === "" || board[i][y].color !== role){
                    continue
                }
                let legal_moves = []
                let directions = [[0,1],[0,-1],[1,0],[-1,0],[-1,-1],[1,1],[-1,1],[1,-1]]
                
                // check moves for every direction
                directions.forEach(direction => {
                    // gets number of pieces in direction
                    let count = countPieces(direction, i,y, board)

                    // if move is legal => push move to legal moves
                    if (checkMoveIsLegal(count, i, y, direction, board)){
                        legal_moves.push(`${i+(direction[0]*count)}/${y+(direction[1]*count)}`)
                    }
                })
                // update lega_moves
                
                board[i][y].legal_moves = legal_moves
                setBoard(board)
            }
        }
        return
      }

      const handleMove = (from, to) => {
        // move piece from old postion to new one
        board[to[0]][to[1]] = board[from[0]][from[1]]
        board[from[0]][from[1]] = ""

        // send room data to server
        socket.emit("send_room_data", {
            roomCode: roomCode,
            board: board,
            selected: [-1,-1],
            player: player === "white" ? "black" : "white"
        })
        return
      }
      const handleClick = (row,col) => {
        // if not players turn => ignore click
        if (player !== role){
            return
        }

        // if nothing is selected
        if (selected[0] === -1 && selected[1] === -1){
            // if square is players stone => select square
            if (board[row][col] !== "" && board[row][col].color === role){
                setSelected([row,col])
                return
            }
        }else{
            // is square is selected
            // if selected square === clicked sqaure => unselected
            if (selected[0] === row && selected[1] === col){
                setSelected([-1,-1])
                return
            }

            // if selected in possible move => move
            if (board[selected[0]][selected[1]].legal_moves.includes(`${row}/${col}`)){
                handleMove(selected, [row, col])
                return
            }
            // if players square => select square
            if (board[row][col] !== "" && board[row][col].color === role){
                setSelected([row,col])
                return
            }

            // if click on selected square or not players square => unselect
            if ((selected[0] === row && selected[1] === col) || board[row][col] === "" || board[row][col].color !== role){
                setSelected([-1,-1])
                return
            }
        }

      }

    return ( 
        <>
        {(!roomFull) ?
            <>
            <a href="https://en.wikipedia.org/wiki/Lines_of_Action" target="_blank"><h3>Rules</h3></a>
            {(!player && !winner) && <h3>Your room code is: {roomCode}</h3>}
            {player && <h3>Your are playing {role}</h3>}
            {player && role === player && <h2>Its your move</h2>}
            {player && role !== player && <h2>Waiting for opponent to move</h2>}
            {(!player && !winner) && <h2>waiting for another player</h2>}
            <div className="quit">
                <a href='/' id="quit"><button>QUIT</button></a>
            </div>
            {winner !== "" && <h3>{winner}</h3>}
            <div className="container">
                <div className="messages">
                    <div className="message">
                        <input 
                            className={"message-input"}
                            placeholder="Message..."
                            maxLength={60}
                            value={message}
                            onChange={(event) => {
                                setMessage(event.target.value);
                            }}
                        />
                        <input
                            type={"submit"}
                            className={"message-input"}
                            value={"send"}
                            onClick={() => {
                                if ((player !== "" || winner !== "") && message !== ""){
                                    messages.push({player: role, message: message})
                                    setMessage("")
                                    socket.emit("send_message",{roomCode: roomCode, messages: messages})
                                }
                            }}
                        />
                    </div>
                    {JSON.parse(JSON.stringify(messages)).reverse().map((message, i) => 
                        <div className="message" key={`${i}`}>
                            <div className={`${message.player === role ? "left": "right"}-message`}>{message.message}</div>
                        </div>
                    )}
                </div>
                        
                <div className="board">
                {board.map((row, i) => row.map((piece, y) => <div key={`${i}/${y}`} onClick={()=>{handleClick(i,y)}}><Cell selected={selected} row={i} col={y} piece={piece} board={board}/></div>))}
                </div>
            </div>
            </> : <>
                    <h2>Room Full</h2>
                    <div className="quit">
                        <a href='/'><button>QUIT</button></a>
                    </div>
                </>
        }
        </>
     );
}

const Cell = ({row, col, selected, piece, board}) => {
    // if row,col in legal_moves of selected piece => piece on row,col is a possible move
    let possible_move = (selected[0] !== -1 && selected[1] !== -1 && board[selected[0]][selected[1]].legal_moves.includes(`${row}/${col}`)) ? "possible-move" : ""
    selected = (selected[0] === row && selected[1] === col) ? "selected" : ""
    piece = (piece === "") ? piece : piece.color

    if (row%2 === 0){
        if (col%2 === 0){
            return (
                <div className={`white-cell ${piece} ${selected} ${possible_move}`}></div>
            )
        }else{
            return (
                <div className={`black-cell ${piece} ${selected} ${possible_move}`}></div>
            )
        }
    }
    if (row%2 !== 0){
        if (col%2 === 0){
            return (
                <div className={`black-cell ${piece} ${selected} ${possible_move}`}></div>
            )
        }else{
            return (
                <div className={`white-cell ${piece} ${selected} ${possible_move}`}></div>
            )
        }
    }


}
 
export default Game;
