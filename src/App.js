import React, {useEffect, useRef, useState} from 'react';
import styles from './App.scss'
import bg from '../static/backgfround_image-modified.jpg'
import bomb from '../static/bomb.png'
import boom from '../static/boom.png'
import soundTrack from '../static/sound_track.mp3'
import flagImage from '../static/flag.png'
const App = () => {
    const [options, setOptions] = useState({
        matrixSize: 10,
        bombCount: 10
    })
    const [cells, setCells] = useState(setEmptyCells)
    const [gameOver, setGameOver] = useState(false)
    const [isMute, setIsMute] = useState(true)
    const sound = useRef()

    function setEmptyCells() {
        const cellMatrix = [];
        for (let i = 0; i < options.matrixSize; i++) {
            const matrixRow = [];
            for (let j = 0; j < options.matrixSize; j++) {
                matrixRow.push({coordinate: {x: j, y: i}, inside: 0, isOpen: false, isFlag: false})
            }
            cellMatrix.push(matrixRow)
        }
        return mineMatrix(options.bombCount, cellMatrix)
    }

    function mineMatrix(mines, matrix) {
        const minesList = [];
        for (let i = 0; i < mines; i++) {
            const couple = randomCouple(matrix[0].length, minesList)
            minesList.push(couple)
        }
        minesList.forEach(mine => {
            matrix[mine[0]][mine[1]].inside = 'mine'
        })
        return setMarkers(matrix)

    }

    function randomCouple(matrixSideLength, uniqueList) {
        let couple = [Math.floor(Math.random() * (matrixSideLength - 1)), Math.floor(Math.random() * (matrixSideLength - 1))];
        if (`${couple}` === `0,0` ||
            `${couple}` === `0,1` ||
            `${couple}` === `1,0` ||
            `${couple}` === `1,1`) {
            return randomCouple(matrixSideLength, uniqueList)
        }
        uniqueList.map(item => {
            if (item[0] === couple[0] && item[1] === couple[1]) {
                couple = randomCouple(matrixSideLength, uniqueList)
            }
        })
        return couple

    }

    function setMarkers(matrix) {
        matrix.forEach((row, rowIndex) => {
            row.forEach((element, elementIndex) => {
                if (element.inside === 0) {
                    return element
                }
                if (element.inside === 'mine') {
                    if (matrix[rowIndex - 1]?.[elementIndex - 1]) setMarker(matrix[rowIndex - 1]?.[elementIndex - 1])
                    if (matrix[rowIndex - 1]?.[elementIndex]) setMarker(matrix[rowIndex - 1]?.[elementIndex])
                    if (matrix[rowIndex - 1]?.[elementIndex + 1]) setMarker(matrix[rowIndex - 1]?.[elementIndex + 1])
                    if (matrix[rowIndex]?.[elementIndex - 1]) setMarker(matrix[rowIndex]?.[elementIndex - 1])
                    if (matrix[rowIndex]?.[elementIndex + 1]) setMarker(matrix[rowIndex]?.[elementIndex + 1])
                    if (matrix[rowIndex + 1]?.[elementIndex - 1]) setMarker(matrix[rowIndex + 1]?.[elementIndex - 1])
                    if (matrix[rowIndex + 1]?.[elementIndex]) setMarker(matrix[rowIndex + 1]?.[elementIndex])
                    if (matrix[rowIndex + 1]?.[elementIndex + 1]) setMarker(matrix[rowIndex + 1]?.[elementIndex + 1])
                }

            })
        })
        return matrix
    }

    function setMarker(element) {
        if (typeof element.inside === 'number') return element.inside += 1
    }


    function openCells(cell) {
        const newMatrix = [...cells];
        if (cell.inside === 'mine') {
            newMatrix.forEach((row, rowIndex) => {
                row.forEach((element, elementIndex) => {
                    if (element.inside === 'mine') {
                        element.isOpen = true;
                    }
                })
            })
            return setGameOver(true)
        }
        if (cell.inside > 0) {
            newMatrix[cell.coordinate.y][cell.coordinate.x].isOpen = true;
        }
        if (cell.inside === 0) {
            const stack = [];
            newMatrix[cell.coordinate.y][cell.coordinate.x].isOpen = true;

            stack.push([cell.coordinate.y, cell.coordinate.x])
            while (stack.length !== 0) {
                stack.forEach((cell, cellIndex) => {
                    newMatrix.forEach((row, rowIndex) => {
                        row.forEach((element, elementIndex) => {
                            if (element.isOpen) {
                                return
                            }
                            if (
                                (cell[1] + 1 === element.coordinate.x ||
                                    cell[1] - 1 === element.coordinate.x ||
                                    cell[1] === element.coordinate.x) &&
                                (cell[0] + 1 === element.coordinate.y ||
                                    cell[0] - 1 === element.coordinate.y ||
                                    cell[0] === element.coordinate.y)) {
                                console.log(cell[1], cell[0])
                                console.log(element.coordinate.y, element.coordinate.x)
                                if (element.inside > 0) {
                                    return newMatrix[rowIndex][elementIndex].isOpen = true;
                                }
                                if (element.inside === 0) {
                                    element.isOpen = true;
                                    return stack.push([rowIndex, elementIndex])
                                }
                            }
                        })
                    })
                })

                stack.shift()
            }
            console.log(stack)
        }
        return setCells(newMatrix)
    }

    function cellClick(e, cell) {
        if (e.button === 0) {
            if (!cell.flag) {
                return openCells(cell)
            }
        }
        if (e.button === 1) {
            if (cells[cell.coordinate.y][cell.coordinate.x].isOpen === true) {
                return;
            }

            const newMatrix = [...cells];
            newMatrix[cell.coordinate.y][cell.coordinate.x].isFlag = !newMatrix[cell.coordinate.y][cell.coordinate.x].isFlag;
            return setCells(newMatrix);
        }
    }

    function toggleMute() {
        sound.current.play()
        setIsMute(!isMute)
    }

    useEffect(() => {
        if (sound) {
            sound.current.muted = isMute;
        }
    }, [isMute]);
    return (
        <div className={styles.page} style={{backgroundImage: `url('${bg}')`}}>
            <div className={styles.gameBar}>
                <button onClick={toggleMute}>
                    mute
                </button>

            </div>
            <div className={styles.container}>
                {cells &&
                    cells.map((row, rowIndex) =>
                        row.map((cell, cellIndex) =>
                            <div
                                key={`${rowIndex}-${cellIndex}`}
                                className={`${styles.cell} ${cell.isOpen ? styles.cell_open : ''} ${cell.isFlag ? styles.cell_flag : ''} ${(cell.isOpen && cell.inside === 'mine') ? styles.cell_mined : ''}`}
                                onMouseDown={(event) => cellClick(event, cell)}
                                style={(cell.inside === 'mine' && cell.isOpen) ? {backgroundImage: `url('${bomb}')`} : cell.isFlag ? {backgroundImage: `url('${flagImage}')`} : {} }
                            >
                                {((cell.inside > 0 && cell.isOpen === true) || gameOver)
                                    ? cell.inside > 0 && !cell.isFlag ? cell.inside : ''
                                    : ''}
                            </div>
                        )
                    )
                }
            </div>
            <div className={`${styles.gameOver} ${gameOver ? styles.gameOver_active : ""}`}>
                GAME OVER
            </div>
            <audio className={styles.soundtrack} src={soundTrack} muted={isMute} ref={sound}>

            </audio>

        </div>
    )
};

export default App;

