
var forge = require('node-forge');

// Executes the given testcase.
// Parameters:
// - testcaseBuffer: Buffer object containing the bytes read from the testcase file.
function processTestcase(testcaseBuffer)
{
    var message = new forge.util.ByteBuffer([1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4]);
	var key = new forge.util.ByteBuffer(testcaseBuffer);
	
	var cipher = forge.cipher.createCipher('AES-ECB', key);
	cipher.start({});
	cipher.update(message);
	cipher.finish();
	
	var encrypted = cipher.output;
}

module.exports = { processTestcase };