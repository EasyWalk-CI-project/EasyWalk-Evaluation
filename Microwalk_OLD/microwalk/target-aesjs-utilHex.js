// Executes the given testcase.
// Parameters:
// - testcaseBuffer: Buffer object containing the bytes read from the testcase file.

var aesjs = require('aes-js');

function processTestcase(testcaseBuffer)
{
    var inputStr = testcaseBuffer.toString("utf-8");
    var data = aesjs.utils.hex.toBytes(inputStr);
    var newStr = aesjs.utils.hex.fromBytes(data);

    console.log("    in:", inputStr);
    console.log("    out:", newStr);
}

module.exports = { processTestcase };
