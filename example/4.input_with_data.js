import process from 'node:process'

process.stdin.on('data', function(data) {
    console.log('user input from stdin', data)
})