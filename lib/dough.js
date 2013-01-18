var File = require('file'),
	server = require('dough/server');

var parser = new (require('args').Parser)();

parser.usage(' [dough command]');
parser.help('Convenience tool to work with Dough.js projects.');

parser.option('s', 'server')
	.help('Runs the Dough.js app in the current directory.')
	.action(require('dough/server').start());

parser.option('-e', '--environment', 'environment')
	.help('');
	.def('development')
	.set();

exports.main = function main(args) {
	var options = parser.parse(args);
}