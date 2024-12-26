let currentWord = '';
let scrambledWord = '';
let coins = 100;
let moves = 0;
let maxMoves = 15; // Default for easy level
let currentLevel = 'easy';
let clueCount = 3; // Default clues for hard level

// API to get random word based on length
async function getWord(length) {
    try {
        const response = await fetch(`https://random-word-api.herokuapp.com/word?length=${length}`);
        const data = await response.json();
        return data[0].toLowerCase();
    } catch (error) {
        console.error('Error fetching word:', error);
        return 'error'; // Fallback word in case of API failure
    }
}

// Scramble the word
function scrambleWord(word) {
    let scrambled = word.split('');
    for (let i = scrambled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
    }
    // Ensure scrambled word is different from the original
    if (scrambled.join('') === word) {
        return scrambleWord(word);
    }
    return scrambled.join('');
}

// Update the coins display
function updateCoins(amount) {
    coins += amount;
    document.getElementById('coins').innerText = `Coins: ${coins}`;
}

// Update moves display
function updateMoves() {
    document.getElementById('moves').innerText = `Moves Left: ${maxMoves - moves}`;
}

// Generate the scrambled letters and dashes
function generateScrambledWord(word) {
    scrambledWord = scrambleWord(word);
    let scrambledWordContainer = document.getElementById('scrambledWordContainer');
    let dashesContainer = document.getElementById('dashesContainer');
    
    scrambledWordContainer.innerHTML = '';
    dashesContainer.innerHTML = '';

    for (let i = 0; i < scrambledWord.length; i++) {
        // Create draggable letter box
        let letterBox = document.createElement('div');
        letterBox.classList.add('draggable-letter');
        letterBox.innerText = scrambledWord[i];
        letterBox.setAttribute('draggable', true);
        letterBox.setAttribute('id', `letter-${i}`);
        scrambledWordContainer.appendChild(letterBox);

        // Create empty dash boxes
        let dashBox = document.createElement('div');
        dashBox.classList.add('dash-box');
        dashBox.setAttribute('id', `dash-${i}`);
        dashesContainer.appendChild(dashBox);

        // Drag and Drop Events
        letterBox.addEventListener('dragstart', dragStart);
        dashBox.addEventListener('dragover', dragOver);
        dashBox.addEventListener('drop', dropLetter);
    }
    moves = 0;
    updateMoves();
}

// Drag and Drop Logic
function dragStart(event) {
    event.dataTransfer.setData('text', event.target.id);
}

function dragOver(event) {
    event.preventDefault();
}

function dropLetter(event) {
    event.preventDefault();
    let letterId = event.dataTransfer.getData('text');
    let letterBox = document.getElementById(letterId);
    let dashBox = event.target;

    if (dashBox.classList.contains('correct-letter')) {
        return;
    }

    if (dashBox.innerText !== '') {
        let originalLetter = document.getElementById(`letter-${dashBox.dataset.index}`);
        if (originalLetter) {
            originalLetter.style.visibility = 'visible';
        }
    }

    if (!dashBox.dataset.index) {
        let index = dashBox.id.split('-')[1];
        dashBox.dataset.index = index;
    }

    let correctLetter = currentWord[dashBox.dataset.index];
    let draggedLetter = letterBox.innerText;

    if (draggedLetter === correctLetter) {
        dashBox.innerText = draggedLetter;
        dashBox.classList.add('correct-letter');
        letterBox.style.visibility = 'hidden';
    } else {
        dashBox.innerText = draggedLetter;
        setTimeout(() => {
            dashBox.innerText = '';
        }, 500);
    }

    moves++;
    updateMoves();

    if (checkIfWordComplete()) {
        let reward = currentLevel === 'easy' ? 20 : currentLevel === 'medium' ? 40 : 60;
        updateCoins(reward);
        displayResultMessage(true);
        showNextAndQuitButtons();
    } else if (moves >= maxMoves) {
        displayResultMessage(false);
        showNextAndQuitButtons();
    }
}

// Check if the player has successfully unscrambled the word
function checkIfWordComplete() {
    const dashBoxes = document.querySelectorAll('.dash-box');
    for (let dashBox of dashBoxes) {
        if (dashBox.innerText !== currentWord[dashBox.dataset.index]) {
            return false;
        }
    }
    return true;
}

// Show congratulatory or game over message
function displayResultMessage(isSuccess) {
    const resultMessage = document.getElementById('resultMessage');
    const playHeading = document.getElementById('playHeading');

    if (isSuccess) {
        playHeading.innerText = 'Congratulations!';
        resultMessage.innerText = `Well done! You've earned more coins. Your total coins: ${coins}`;

        document.querySelectorAll('.fa').forEach(star => {
            star.style.visibility = 'visible';
        });
    } else {
        playHeading.innerText = 'Game Over!';
        resultMessage.innerText = 'Better luck next time! You\'ve exceeded the moves limit.';
    }
}

// Show Next and Quit buttons, hide game controls
function showNextAndQuitButtons() {
    document.getElementById('afterCorrect').style.display = 'block';
    document.getElementById('gameControls').style.display = 'none';
    document.getElementById('quitButton').style.display = 'inline-block';
}

// Reset the play page to its original state for the next round
async function resetPlayPage() {
    document.getElementById('afterCorrect').style.display = 'none';
    document.getElementById('gameControls').style.display = 'block';
    document.getElementById('playHeading').innerText = 'Unscramble the Word';
    document.getElementById('resultMessage').innerText = '';
    document.querySelectorAll('.fa').forEach(star => {
        star.style.visibility = 'hidden';
    });
    await generateNewWord();
}
function resetHomePage() {
    // Reset the play page elements (if needed)
    document.getElementById('home').style.display = 'block';
    document.getElementById('play').style.display = 'none';
    document.getElementById('playHeading').innerText = 'Unscramble the Word';
    document.getElementById('resultMessage').innerText = '';
    document.getElementById('afterCorrect').style.display = 'none';
    document.getElementById('gameControls').style.display = 'block';
    document.querySelectorAll('.fa').forEach(star => {
        star.style.visibility = 'hidden';
    }); 
    coins = 100;
    moves = 0;
    currentWord = '';
    scrambledWord = '';
    maxMoves = 15;
}


// Generate a new word based on current level
async function generateNewWord() {
    let wordLength = currentLevel === 'easy' ? 5 : currentLevel === 'medium' ? 8 : 12;
    currentWord = await getWord(wordLength);

    if (currentWord === 'error') {
        document.getElementById('playHeading').innerText = 'Error!';
        document.getElementById('resultMessage').innerText = 'Unable to fetch a new word. Please try again later.';
        document.getElementById('afterCorrect').style.display = 'block';
        document.getElementById('gameControls').style.display = 'none';
        return;
    }

    generateScrambledWord(currentWord);
}

// Change the game level and update max moves
function changeLevel() {
    let selectedLevel = document.getElementById('changeLevelDropdown').value;
    currentLevel = selectedLevel;

    maxMoves = selectedLevel === 'easy' ? 15 : selectedLevel === 'medium' ? 17 : 18;
    clueCount = selectedLevel === 'hard' ? 2 : 0;
    resetPlayPage(); 
}

// Fill in two random correct letters as clues
function fillClueLetters() {
    const dashBoxes = document.querySelectorAll('.dash-box');
    const indices = new Set();

    while (indices.size < 2) {
        const randomIndex = Math.floor(Math.random() * currentWord.length);
        indices.add(randomIndex);
    }

    indices.forEach(index => {
        const dashBox = dashBoxes[index];
        dashBox.innerText = currentWord[index];
        dashBox.classList.add('correct-letter');
    });
}

// Handle clue button click
function handleClueButton() {
    if (currentLevel === 'hard') {
        if (clueCount > 0) {
            fillClueLetters();
            clueCount--;
        } else if (coins >= 200) {
            fillClueLetters();
            updateCoins(-200); // Deduct coins for extra clue
        } else {
            alert("No more clues available. You need at least 200 coins for additional clues.");
        }
    } else {
        alert("Clues are only available for the hard level.");
    }
}

// Event Listeners
document.getElementById('startButton').addEventListener('click', async () => {
    document.getElementById('home').style.display = 'none';
    document.getElementById('play').style.display = 'block';
    resetPlayPage();
    await generateNewWord();
});

document.getElementById('newWordButton').addEventListener('click', async () => {
    await generateNewWord();
});

document.getElementById('changeLevelDropdown').addEventListener('change', changeLevel);

document.getElementById('nextButton').addEventListener('click', async () => {
    await resetPlayPage();
});

// Quit button event listener to return to the home screen
document.getElementById('quitButton').addEventListener('click',()=>{
    resetHomePage()
});
document.getElementById('quit').addEventListener('click',()=>{
    resetHomePage()
});



document.getElementById('clueButton').addEventListener('click',handleClueButton);
