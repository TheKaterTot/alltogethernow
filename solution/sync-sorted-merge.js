'use strict'
const fs = require('fs')
const moment = require('moment')
const rimraf = require('rimraf')

function dateKey(log) {
	let logDate = moment(log.date).utc()

	return logDate.format('YYYYMMDD')
}

function sort(sortables) {
	let len = sortables.length
	let i, j
	for (i = 1; i < len; i++) {
		let temp = sortables[i]
		for (j = i - 1; j >= 0 && (sortables[j].date > temp.date); j--) {
			sortables[j + 1] = sortables[j]
		}
		sortables[j+1] = temp
	}
	return sortables
}

module.exports = (logSources, printer) => {
	fs.mkdirSync('temp')
	let wstreams = {}
	for (let entry of logSources) {
		let log
		while (!entry.drained) {
			log = entry.pop()
			if (!log) {
				break
			}
			let date = dateKey(log)
			if(!wstreams[date]) {
				wstreams[date] = fs.createWriteStream(`temp/${date}.txt`)
			}
			wstreams[date].write(JSON.stringify(log) + '\n')
		}
	}
	Promise.all(Object.keys(wstreams).map((date) => {
		return new Promise((resolve, reject) => {
			wstreams[date].end((err) => {
				if (err) {
					return reject(err)
				}
				resolve()
			})
		})
	})).then(() => {
		for (let date of Object.keys(wstreams)) {
			let filepath = `temp/${date}.txt`
			let fileContents = fs.readFileSync(filepath, {encoding: 'utf8'})
			let entries = fileContents.split('\n')
			entries.pop()
			let logs = entries.map((entry) => {
				let newEntry = JSON.parse(entry)
				newEntry.date = moment(newEntry.date)
				return newEntry
			})
			sort(logs).forEach((log) => {
				log.date = log.date.toDate()
				printer.print(log)
			})
		}
		rimraf.sync('temp')
		printer.done()
	})
}
