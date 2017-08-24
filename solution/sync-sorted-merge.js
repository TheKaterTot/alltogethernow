'use strict'
const fs = require('fs')

module.exports = (logSources, printer) => {
	let wstream = fs.createWriteStream('spike.txt')
	for (let entry of logSources) {
		wstream.write(JSON.stringify(entry) + '\n')
	}
	wstream.end()
}

//if date meets x parameters, sort into x bucket
//if date meets y parameters, sort into y bucket
//each bucket is a stream
