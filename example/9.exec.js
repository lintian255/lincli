import { exec } from 'node:child_process'

let child = exec('npx create-react-app my-app')

child.stdout.on('data', function(data) {
    console.log(data.toString('utf-8'))
})

child.stderr.on('data', function(error) {
    console.log('error', error.toString('utf-8'))
})

child.on('exit', function(code) {
    console.log('close', code)
})