/* script.js */

const startWord = "HEAD";
const endWord = "TAIL";
let currentGuess = "";
let guessRow = 0;
let lastValidWord = startWord;
let guessHistory = [];  // Store all valid guesses
const wordCache = {};
let popupTimeout;


async function isValidWord(word) {
    if (wordCache[word] !== undefined) {
        return wordCache[word];  // Use cached result
    }

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

        if (response.status === 200) {
            wordCache[word] = true;
            return true;
        } else {
            wordCache[word] = false;
            return false;
        }
    } catch (error) {
        console.error("Network error:", error);
        return false;
    }
}


function initGame() {
    const startRow = document.getElementById('start-word');
    const endRow = document.getElementById('end-word');

    for (let char of startWord) {
        const box = document.createElement('div');
        box.className = 'tile filled';
        box.textContent = char;
        startRow.appendChild(box);
    }

    for (let char of endWord) {
        const box = document.createElement('div');
        box.className = 'tile filled';
        box.textContent = char;
        endRow.appendChild(box);
    }

    addNewGuessRow();
    createPopup();
}

function createPopup() {
        const popup = document.createElement('div');
        popup.id = 'popup-message';
        popup.className = 'popup-message';
        document.body.appendChild(popup);
}


function showPopup(message) {

    
    const currentRow = document.querySelector(`#guess-grid .word-row:nth-child(${guessRow + 1})`);
    const popup = document.getElementById('popup-message');

    clearTimeout(popupTimeout);  // Clear existing timeout
    popup.classList.remove('show');


    if (currentRow && popup) {
        popup.textContent = message;

        popup.style.visibility = 'hidden';
        popup.style.display = 'block';

        const rowRect = currentRow.getBoundingClientRect();
        const popupWidth = popup.offsetWidth;

        popup.style.position = 'absolute';
        popup.style.top = `${window.scrollY + rowRect.top - 30}px`;
        popup.style.left = `${window.scrollX + rowRect.left + (rowRect.width / 2) - (popupWidth / 2)}px`;

        popup.style.visibility = 'visible';
        popup.classList.add('show');

        popupTimeout = setTimeout(() => {
            popup.style.opacity = '0';
            setTimeout(() => {
                popup.classList.remove('show');
                popup.style.display = 'none';
                popup.style.opacity = '1';
            }, 400);
        }, 1000);
    }
}


function resetGame() {
    currentGuess = "";
    guessRow = 0;
    lastValidWord = startWord;
    guessHistory = [];  

    const guessGrid = document.getElementById('guess-grid');
    if (guessGrid) {
        guessGrid.innerHTML = "";  // Clear guesses only
    }


    const popup = document.getElementById('popup-message');
    if (popup) {
        popup.classList.remove('show');
        popup.style.display = 'none';
    }

    document.getElementById('start-word').innerHTML = "";
    document.getElementById('end-word').innerHTML = "";

    // Remove all tile styles
    document.querySelectorAll('.tile').forEach(tile => {
        tile.classList.remove('correct-letter', 'changed-letter', 'filled');
        tile.textContent = "";
    });

    initGame();
}

// Add event listener to the reset button
document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.getElementById('reset-button');
    resetButton.addEventListener('click', resetGame);
});

document.getElementById('reset-button').addEventListener('click', (event) => {
    event.preventDefault();  // Prevent any page reload
    resetGame();
});


//congratulations PopUp

function showCongratsPopup() {
    const popup = document.getElementById('congrats-popup');
    popup.style.display = 'flex';

    // WhatsApp Share Button
    const shareButton = document.getElementById('whatsapp-share-btn');
    const message = generateShareMessage();  
    //const message = `🎉 I just solved the Word Ladder game! From ${startWord} ➡️ ${endWord}.\nCan you beat my score? 😎`;
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;

    shareButton.onclick = function () {
        window.open(whatsappURL, '_blank');
    };

    // Play Again Button
    document.getElementById('play-again-btn').onclick = function () {
        popup.style.display = 'none';
        resetGame();
    };

    // Close Button
    document.getElementById('popup-close').onclick = function () {
        popup.style.display = 'none';
    };
}



// Show popup when the game is won
async function submitWord() {
    if (currentGuess.length !== 4) {
      //  showPopup("Enter a 4-letter word");
        return;
    }
    
    isValidWord(currentGuess.toLowerCase()).then(valid => {
        if (!valid) {
            showPopup("Not a valid word");
            return;
        }

        if (!isOneLetterDifferent(currentGuess, lastValidWord)) {
            showPopup("Change only one letter!");
            return;
        }

        guessHistory.push(currentGuess);  // Save the guess


        highlightCorrectLetters(currentGuess);
        highlightChangedLetters(currentGuess, lastValidWord);

        if (currentGuess === endWord) {
            highlightFinalRow();
            showCongratsPopup();  // Show the custom popup
        } else {
            lastValidWord = currentGuess;
            guessRow++;
            currentGuess = "";
            addNewGuessRow();
        }
    });
}

// whatsapp progress message 
function generateEmojiProgress() {
    let progressGrid = "";

    guessHistory.forEach(guess => {
        for (let i = 0; i < 4; i++) {
            if (guess[i] === endWord[i]) {
                progressGrid += "🟩";  
            } else {
                progressGrid += "⬜";       // ⬜ White square
            }
        }
        progressGrid += "\n";  // New line after each guess
    });

    return progressGrid;
}



//Whatsapp Message
function generateShareMessage() {
    const progress = generateEmojiProgress();
    const attempts = guessHistory.length;
    let shareMessage =   `Worder\n\n${startWord}\n${progress}${endWord}\n\nCan you beat my score? https://echoesofcode.github.io/Worder/`;
    return shareMessage;
}



function addNewGuessRow() {
    const guessGrid = document.getElementById('guess-grid');
    const row = document.createElement('div');
    row.className = 'word-row';
    for (let i = 0; i < 4; i++) {
        const box = document.createElement('div');
        box.className = 'tile empty';
        box.setAttribute('id', `box-${guessRow}-${i}`);
        row.appendChild(box);
    }
    guessGrid.appendChild(row);
    row.scrollIntoView({ behavior: 'smooth' });
}

function handleKeyPress(letter) {
    if (currentGuess.length < 4) {
        currentGuess += letter;
        updateCurrentRow();
    }
}

function deleteLetter() {
    if (currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
        updateCurrentRow();
    }
}

function updateCurrentRow() {
    for (let i = 0; i < 4; i++) {
        const box = document.getElementById(`box-${guessRow}-${i}`);
        box.textContent = currentGuess[i] || "";
    }
}

function isOneLetterDifferent(word1, word2) {
    if (word1.length !== word2.length) {
        return false;  // Words must be the same length
    }

    let differenceCount = 0;

    for (let i = 0; i < word1.length; i++) {
        if (word1[i].toLowerCase() !== word2[i].toLowerCase()) {
            differenceCount++;
        }
        if (differenceCount > 1) {
            return false;  // More than one difference detected
        }
    }

    return differenceCount === 1;  // Must differ by exactly one letter
}


function highlightCorrectLetters(word) {
    for (let i = 0; i < 4; i++) {
        const box = document.getElementById(`box-${guessRow}-${i}`);
        if (word[i] === endWord[i]) {
            box.classList.add('correct-letter');
        }
    }
}

function highlightChangedLetters(word1, word2) {
    for (let i = 0; i < 4; i++) {
        const box = document.getElementById(`box-${guessRow}-${i}`);
        if (word1[i] !== word2[i]) {
            box.classList.add('changed-letter');
        }
    }
}

function highlightFinalRow() {
    const guessGrid = document.getElementById('guess-grid');
    const finalRow = guessGrid.lastChild;
    finalRow.querySelectorAll('.tile').forEach(tile => {
        tile.classList.add('correct-letter');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initGame();

    // On-screen keyboard functionality
    document.querySelectorAll('.key').forEach(button => {
        button.addEventListener('click', () => handleKeyPress(button.textContent));
    });

    document.getElementById('enter-key').addEventListener('click', () => {
        submitWord();
    });

    document.querySelector('[onclick="deleteLetter()"]')?.addEventListener('click', () => {
        deleteLetter();
    });

    // Physical keyboard functionality
    document.addEventListener('keydown', (event) => {
        const key = event.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
            handleKeyPress(key);
        } else if (event.key === 'Enter') {
            submitWord();
        } else if (event.key === 'Backspace') {
            deleteLetter();
        }
    });
});
