// 4.input_with_line.js
import process from 'node:process'
import readline from 'node:readline'

const rl = readline.createInterface(process.stdin, process.stdout)

rl.on('line', function(line) {
    console.log('user input from readline', line)
})