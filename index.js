#!/usr/bin/env node
import { argv } from 'node:process'

let argsMapper = {}
for (let arg of argv.slice(2)) {
    let [k, v] = arg.split('=')
    argsMapper[k] = v
}

// 运行 linnpm a1=b1 a2=b2 a3=b3 
console.log('lin cli', argsMapper)