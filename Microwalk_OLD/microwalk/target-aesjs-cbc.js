// Executes the given testcase.
// Parameters:
// - testcaseBuffer: Buffer object containing the bytes read from the testcase file.

var aesjs = require('aes-js');

function processTestcase(testcaseBuffer)
{
    var message = new Uint8Array([1, 1, 2, 2, 3, 3, 4, 4, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 5, 5, 6, 6, 7, 7, 8, 8]);
    var iv =      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

	var key = new Uint8Array(testcaseBuffer);
    var aes = new aesjs.ModeOfOperation.cbc(key, iv);
    
    var encryptedBytes = aes.encrypt(message);
    console.log(encryptedBytes);
    var decryptedBytes = aes.decrypt(encryptedBytes);
    console.log(decryptedBytes);
}

module.exports = { processTestcase };
