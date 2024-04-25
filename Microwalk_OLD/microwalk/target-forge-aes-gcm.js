
var forge = require('node-forge');

// Executes the given testcase.
// Parameters:
// - testcaseBuffer: Buffer object containing the bytes read from the testcase file.
function processTestcase(testcaseBuffer)
{
    var message = forge.util.createBuffer();
	message.putString('aaaabbbbaaaabbbbaaaabbbbaaaabbbb');

	var iv = forge.util.createBuffer();
	iv.putString('aaaabbbbcccc')

	var key = forge.util.createBuffer(testcaseBuffer);

	var cipher = forge.cipher.createCipher('AES-GCM', key);

	cipher.start({iv: iv.bytes(12)});
	cipher.update(message);
	cipher.finish();
	
	var encrypted = cipher.output;
	var tag = cipher.mode.tag;
}


module.exports = { processTestcase };