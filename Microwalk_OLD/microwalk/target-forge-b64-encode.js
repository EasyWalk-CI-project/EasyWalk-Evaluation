
var forge = require('node-forge');

// Executes the given testcase.
// Parameters:
// - testcaseBuffer: Buffer object containing the bytes read from the testcase file.
function processTestcase(testcaseBuffer)
{
	var binary = forge.util.createBuffer(testcaseBuffer);
	var b64message = forge.util.encode64(binary.data);
}

module.exports = { processTestcase };