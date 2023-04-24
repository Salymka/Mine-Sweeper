import React, {useEffect, useRef, useState} from 'react';
import styles from './App.scss';
import bg from '../static/backgfround_image-modified.jpg';
import bomb from '../static/bomb2.png';
import soundTrack from '../static/sound_track.mp3';
import gameOverSound from '../static/game_over.wav';
import flagImage from '../static/flag.png';
import volumeImg from '../static/volume.png'
import muteVolumeImg from '../static/muteVolume.png'
import leftClickImg from '../static/left_click_mouse_icon.png'
import middleClickImg from '../static/middle_click_mouse_icon.png'


const App = () => {
    const [options, setOptions] = useState({
        matrixSize: 10,
        bombCount: 10,
        volume: -1,
    });
    const [gameResults, setGameResults] = useState({
        status: 'playing',
        gameResults: ''
    });
    const [cells, setCells] = useState(setEmptyCells(options.matrixSize, options.bombCount));
    const soundtrackRef = useRef();
    const gameOverSoundRef = useRef();
    const playgroundSizeRef = useRef();


    // Set cells to matrix
    function setEmptyCells(size, bombCount) {
        const cellMatrix = [];
        for (let i = 0; i < size; i++) {
            const matrixRow = [];
            for (let j = 0; j < size; j++) {
                matrixRow.push({coordinate: {x: j, y: i}, inside: 0, isOpen: false, isFlag: false});
            }
            cellMatrix.push(matrixRow)
        }
        return mineMatrix(bombCount, cellMatrix);
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
                couple = randomCouple(matrixSideLength, uniqueList);
            }
        })
        return couple;
    }

    function setMarkers(matrix) {
        matrix.forEach((row, rowIndex) => {
            row.forEach((element, elementIndex) => {
                if (element.inside === 'mine') {
                    checkNeighbours(matrix, rowIndex, elementIndex);
                }
            })
        })
        return matrix
    }

    function checkNeighbours(matrix, rowIndex, elementIndex) {
        const neighbours = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        neighbours.forEach(offset => {
            const neighbourRow = rowIndex + offset[0];
            const neighbourElement = elementIndex + offset[1];

            if (matrix[neighbourRow]?.[neighbourElement]) {
                setMarker(matrix[neighbourRow][neighbourElement]);
            }
        });
    }

    function setMarker(element) {
        if (element.inside >= 0) return element.inside += 1;
    }


    // Restart
    function restartGame(matrixSize, bombCount) {
        setGameResults({...gameResults, status: 'playing', gameResults: ''})
        setCells(setEmptyCells(matrixSize ? matrixSize : options.matrixSize, bombCount ? bombCount : options.bombCount))
    }


    //Logic
    function openCell(cell) {
        const newMatrix = [...cells];
        if (cell.inside === 'mine') {
            playGameOverSound()
            newMatrix.forEach(row => {
                row.forEach(element => {
                    if (element.inside === 'mine') {
                        element.isOpen = true;
                    }
                })
            })
            return setGameResults({...gameResults, status: 'loss', gameResults: 'You Loss :(\nGAME OVER '})
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
                                return;
                            }
                            if (
                                (cell[1] + 1 === element.coordinate.x ||
                                    cell[1] - 1 === element.coordinate.x ||
                                    cell[1] === element.coordinate.x) &&
                                (cell[0] + 1 === element.coordinate.y ||
                                    cell[0] - 1 === element.coordinate.y ||
                                    cell[0] === element.coordinate.y)) {

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
        }
        checkGameStatus(newMatrix);
        return setCells(newMatrix)
    }

    function checkGameStatus(matrix) {
        let isCloseCells = false
        matrix.forEach(row => {
            row.forEach(cell => {
                if (cell.inside >= 0 && !cell.isOpen) {
                    isCloseCells = true
                }
            })
        })
        if (isCloseCells) return
        return setGameResults({...gameResults, status: 'win', gameResults: 'You Win!!! \nTry harder settings))'})
    }

    function cellClick(e, cell) {
        if (e.button === 0) {
            cell.isFlag = false;
            return openCell(cell)

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

    function changeBombCount(event) {
        setOptions({...options, bombCount: +event.target.value})
        restartGame('', +event.target.value)
    }

    function changeMatrixSize(event) {
        setOptions({...options, matrixSize: +event.target.value})
        restartGame(+event.target.value, '')
    }


    //Sounds
    function toggleMute() {
        if (options.volume === -1) {
            soundtrackRef.current.volume = 0.1;
            setOptions({...options, volume: 0.1})
            soundtrackRef.current.play();
            return;
        }
        if (soundtrackRef.current.volume === 0) {
            soundtrackRef.current.volume = options.volume;
            setOptions({...options})
            return;
        }
        if (soundtrackRef.current.volume > 0) {
            soundtrackRef.current.volume = 0;
            setOptions({...options})
        }
    }

    function changeVolume(event) {
        if (options.volume === -1) {
            soundtrackRef.current.play()
        }
        soundtrackRef.current.volume = +event.target.value
        setOptions({...options, volume: +event.target.value})
    }

    function playGameOverSound() {
        if (soundtrackRef.current.volume > 0 && options.volume !== -1) {
            gameOverSoundRef.current.volume = (soundtrackRef.current.volume * 1.5 < 1) ? soundtrackRef.current.volume * 1.5 : 1;
            soundtrackRef.current.volume = 0;
            gameOverSoundRef.current.play();
            setTimeout(() => {
                soundtrackRef.current.volume = options.volume;
            }, gameOverSoundRef.current.duration * 1000 - 2000)
        }
    }



    return (
        <div className={styles.page} style={{backgroundImage: `url('${bg}')`}}>
            <div className={styles.gameBar}>

                <h2 className={styles.gameBar__title}>
                    {`Game Settings`}
                </h2>
                <div className={styles.gameBar__musicSettings}>
                    <button onClick={toggleMute}>
                        <img
                            src={soundtrackRef.current?.volume === 0 || options.volume === -1 ? muteVolumeImg : volumeImg}
                            alt={'volume'}
                            className={styles.volumeImg}/>
                    </button>
                    <input
                        type='range'
                        min={0}
                        max={1}
                        step={0.05}
                        value={options.volume}
                        onChange={changeVolume}/>
                </div>

                <div className={styles.rangeBar}>
                    <p className={styles.gameBar__settingTitle}>
                        {`Playground  size  (n * n)`}
                    </p>
                    <div>
                        <label className={styles.rangeLabel}>
                            {options.matrixSize}
                        </label>
                        <input
                            type='range'
                            min={5}
                            max={15}
                            step={1}
                            id={'matrixRange'}
                            value={options.matrixSize}
                            onChange={changeMatrixSize}/>
                    </div>
                </div>

                <div className={styles.rangeBar}>
                    <p className={styles.gameBar__settingTitle}>
                        {`Bomb  count`}
                    </p>
                    <div>
                        <label className={styles.rangeLabel}>
                            {options.bombCount}
                        </label>
                        <input
                            type='range'
                            min={5}
                            max={Math.round(options.matrixSize * options.matrixSize * 0.3)}
                            step={1}
                            id={'matrixRange'}
                            value={options.bombCount}
                            onChange={changeBombCount}/>
                    </div>
                </div>

                <button onClick={() => restartGame()} className={styles.restartBtn}>
                    RESTART
                </button>

                <div className={styles.gameBar__rules}>
                    <div className={styles.gameBar__rule}>
                        <img src={leftClickImg} alt={'left-click'}/>
                        <label>
                            {`- Open cell`}
                        </label>
                    </div>
                    <div className={styles.gameBar__rule}>
                        <img src={middleClickImg} alt={'middle-click'}/>
                        <label>
                            {`- Set/Unset Flag`}
                        </label>
                    </div>
                </div>
            </div>

            <div className={styles.containerBack}>
                <div className={styles.container} ref={playgroundSizeRef}>
                    {cells &&
                        cells.map((row, rowIndex) =>
                            row.map((cell, cellIndex) =>
                                <div
                                    key={`${rowIndex}-${cellIndex}`}
                                    className={`${styles.cell} ${cell.isOpen ? styles.cell_open : ''} ${cell.isFlag ? styles.cell_flag : ''} ${(cell.isOpen && cell.inside === 'mine') ? styles.cell_mined : ''}`}
                                    onMouseDown={(event) => cellClick(event, cell)}
                                    style={{
                                        width: playgroundSizeRef.current?.clientWidth / options.matrixSize || '',
                                        height: playgroundSizeRef.current?.clientWidth / options.matrixSize || '',
                                        backgroundImage: (cell.inside === 'mine' && cell.isOpen) ? `url('${bomb}')` : cell.isFlag ? `url('${flagImage}')` : '',
                                    }}>
                                    {((cell.inside > 0 && cell.isOpen === true) || gameResults.status === 'loss')
                                        ? cell.inside > 0 && !cell.isFlag ? cell.inside : ''
                                        : ''}
                                </div>
                            )
                        )
                    }
                </div>
            </div>

            <div className={`${styles.gameOver} ${gameResults.status !== 'playing' ? styles.gameOver_active : ""}`}>
                {gameResults.gameResults}
            </div>
            <audio src={soundTrack} autoPlay ref={soundtrackRef} loop></audio>
            <audio src={gameOverSound} ref={gameOverSoundRef}></audio>
        </div>
    )
};

export default App;

