import { shuffle } from '../utils/array'

/** Characters used for random output generation. */
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*!█░▒▓'

/** Loading messages to display during the "loading" phase. */
const quotes = [
  'Binary beats fuel the revolution.',
  'Bootstrapping the future, one bit at a time.',
  'Synthesizers: the heartbeat of the soul.',
  'Hack the planet; code the soul.',
  'Debugging reality since 1978.',
  'Tape decks and punch cards, dreams in the machine.',
  'All your base are belong to us.',
  '808s and algorithms, the rhythm of the future.',
  'Digital rain never sleeps.',
  'Reboot, rewire, repeat.',
  'The sound of progress is 120 BPM.',
  'Think analog, act digital.',
  'Pixel-perfect precision, byte by byte.',
  'Loops within loops; the code never ends.',
  'Synthesizing harmony from chaos.',
  'Modulated waves crash on silicon shores.',
  'From floppy disks to the infinite cloud.',
  'Coded in BASIC, dreaming in neon.',
  'Artificial vibes, human grooves.',
  'Insert quarter to continue.',
  'Electric dreams powered by kilobytes.',
  'When machines hum, the future sings.',
  'Commodore kids, forever in sync.',
  'Synthwave sunsets and cyber dawns.',
  '0s and 1s form the ultimate jam session.',
  'Data is the new disco.',
  'Hackers write the ballads of progress.',
  'When the Moog speaks, humanity listens.',
  'Zigzagging between zeros, chasing infinity.',
  'Silicon symphonies, unbroken by time.',
  'Through the wires, creativity flows.',
  'Byte-sized beats, megaton dreams.',
  'Digital love stories, crafted in assembler.',
  'The sound of tomorrow lives in the code of today.',
  'Synths and circuits, our legacy in sound.',
  'Neon grids stretch across the virtual skyline.',

  'Segmentation Fault: Memory access violation occurred',
  'Bus Error: Non-existent memory address accessed',
  'Device Not Ready: Check hardware connection or configuration',
  'Out of Memory: Unable to allocate additional memory',
  'Illegal Function Call: Invalid operation attempted',
  'Divide by Zero Warning: Arithmetic operation failed',
  'File Not Found: Ensure the file path is correct',
  'Invalid File Handle: The file descriptor is not valid',
  'General Protection Fault: Critical system error encountered',
  'Bad Command or File Name: Invalid input received',
  'Abort Retry Fail: Please select a recovery option',
  'No Match Found: Query returned no results',
  'Cannot Read from Drive A: Check the disk or drive',
  'Checksum Error: Data integrity compromised',
  'Unexpected Token: Parser encountered an unknown symbol',
  'Label Not Found: Control flow cannot proceed',
  'Printer Out of Paper: Please reload and try again',
  'Disk Full: Save operation aborted',
  'Unknown Interrupt: Unexpected hardware signal',
  'Access Denied: Permissions insufficient for this action',
  'No Space Left on Device: Unable to complete write operation',
  'Bad Sector Detected: Disk health warning',
  'Unhandled Exception: Application crashed unexpectedly',
  'Variable Not Defined: Ensure all variables are declared',
  'Type Mismatch: Data type conflict detected',
  'Input/Output Error: Communication with device failed',
  'Invalid Opcode: Unknown instruction encountered',
  'Key Not Present: Required data missing in input',
  'Break Encountered: Execution interrupted by user',
  'Corrupted Header: Data format not recognized',
  'Null Pointer Dereference: Invalid memory reference',
  'Missing Operand: Complete expression required',
  'Unexpected End of Input: Premature termination of data',
  'Invalid Address: Memory location outside valid range',
  'Hexadecimal Error: Incorrect format or invalid characters',
  'Floating Point Exception: Invalid numeric operation',
  'Fatal Error: System unable to continue execution',
  'Electro Pulse Detected',
  'Initialize LFO Sequence',
  'Binary Drift Active',
  'Quantum Sync Failure',
  'Oscillator Locked',
  'MIDI Signal Found',
  'Waveform Modulation',
  'Patch Matrix Error',
  'Voltage Controlled Oscillator',
  'Data Cascade Imminent',
  'Digital Noise Burst',
  'Phase Shift Override',
  'Low Bit Depth Engaged',
  'Cybernetic Link Established',
  'Circuit Bent Reality',
  'Mod Wheel Active',
  'Granular Synthesis Initiated',
  'Audio Stream Clipping',
  'Clock Divider Error',
  'Polyphonic Glitch Mode',
]

/**
 * Retrieves a shuffled selection of random loading messages.
 * @returns {string[]} An array of 12 random loading messages.
 */
function getRandomLoadingMessages() {
  return quotes.sort(() => Math.random() - 0.5).slice(0, 12)
}

/**
 * Creates a glitch animation sequence for a grid.
 * @param {Object} options - Configuration options for the glitch animation.
 * @param {number} options.cols - Number of columns in the grid.
 * @param {number} options.rows - Number of rows in the grid.
 * @param {function(number, number, string): void} options.setText - Function to set text in the grid at a specific position.
 * @param {string[]} options.textArr - Array representing the current grid text state.
 * @returns {function(): void} A function to update the glitch animation.
 */
export default function glitch({ cols, rows, setText, textArr }) {
  const loadingMessages = getRandomLoadingMessages()
  let loadingStep = 0
  let progress = 0
  let loadingPhase = true
  let glitchPhase = false

  /**
   * Sets a character at a specific index in the grid.
   * @param {number} index - The linear index in the grid.
   * @param {string} char - The character to set at the given index.
   */
  const setChar = (index, char) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    setText(row, col, char)
  }

  /**
   * Generates a random sequence of characters.
   * @param {number} length - The length of the sequence.
   * @returns {string} A random string of the specified length.
   */
  const generateRandomOutput = (length) => {
    let output = ''
    for (let i = 0; i < length; i++) {
      output += characters[Math.floor(Math.random() * characters.length)]
    }
    return output
  }

  /**
   * Executes the loading phase animation.
   */
  const loading = () => {
    if (loadingStep < loadingMessages.length) {
      const message = shuffle(loadingMessages[loadingStep].split(' ')).join(' ')

      const diff = Math.floor(Math.random() * 20)
      for (let i = 0; i < message.length; i++) {
        setChar(loadingStep * cols + i - diff, message[i])
      }
      loadingStep++
    } else if (loadingStep < loadingMessages.length + 5) {
      const row = loadingMessages.length
      const barLength = Math.max(0, Math.floor((progress / 100) * (cols - 10)))
      const bar =
        '[' +
        '█'.repeat(barLength) +
        ' '.repeat(Math.max(0, cols - 10 - barLength)) +
        ']'
      for (let i = 0; i < bar.length; i++) {
        setChar(row * cols + i, bar[i])
      }
      progress += 5
      if (progress >= 100) {
        loadingStep++
      }
    } else {
      const randomRow = Math.floor(Math.random() * rows)
      const randomLength = Math.floor(Math.random() * (cols - 10)) + 10
      const output = generateRandomOutput(randomLength)
      for (let i = 0; i < output.length; i++) {
        setChar(randomRow * cols + i, output[i])
      }
      if (loadingStep > loadingMessages.length + 20) {
        loadingPhase = false
        glitchPhase = true
      }
      loadingStep++
    }
  }

  /**
   * Executes the glitch phase animation.
   */
  const finalGlitch = () => {
    const glitchCount = Math.floor(Math.random() * 4) + 1

    for (let n = 0; n < glitchCount; n++) {
      const i = Math.floor(Math.random() * textArr.length)

      if (textArr[i].trim() || Math.random() < 0.1) {
        if (Math.random() < 0.2) {
          const randomWord = quotes[
            Math.floor(Math.random() * quotes.length)
          ].slice(0, Math.floor(Math.random() * 8) + 3)
          const startIndex = Math.max(0, i - randomWord.length)
          for (
            let j = 0;
            j < randomWord.length && startIndex + j < textArr.length;
            j++
          ) {
            setChar(startIndex + j, randomWord[j])
          }
        } else if (Math.random() < 0.5 && textArr[i].trim()) {
          setChar(i, characters[Math.floor(Math.random() * characters.length)])
        }
      }
    }

    if (Math.random() < 0.15) {
      const randomRow = Math.floor(Math.random() * rows)
      const randomCol = Math.floor(Math.random() * cols)
      let pos = randomRow * cols + randomCol
      if (textArr[pos].trim()) {
        if (textArr[pos] === '█') {
          setChar(pos, ' ')
        } else {
          setChar(pos, '█')
        }
      }
    }

    setTimeout(
      () => requestAnimationFrame(finalGlitch),
      Math.random() * 100 + 1000
    )
  }

  let lastFrameTime = Date.now()
  const frameInterval = 50

  return () => {
    const now = Date.now()
    if (now - lastFrameTime > frameInterval) {
      if (loadingPhase) {
        loading()
      } else if (glitchPhase) {
        finalGlitch()
      }
      lastFrameTime = now
    }
  }
}
