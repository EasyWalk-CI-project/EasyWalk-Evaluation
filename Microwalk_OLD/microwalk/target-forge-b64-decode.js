
var forge = require('node-forge');

// Executes the given testcase.
// Parameters:
// - testcaseBuffer: Buffer object containing the bytes read from the testcase file.
function processTestcase(testcaseBuffer)
{
	var message = forge.util.createBuffer(testcaseBuffer).toString();
	var binary = forge.util.decode64(message)
}

module.exports = { processTestcase };