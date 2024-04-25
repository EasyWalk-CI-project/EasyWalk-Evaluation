
var forge = require('node-forge');

// Executes the given testcase.
// Parameters:
// - testcaseBuffer: Buffer object containing the bytes read from the testcase file.
function processTestcase(testcaseBuffer)
{
    var message = forge.util.createBuffer();
    message.putString('aaaabbbbaaaabbbbaaaabbbbaaaabbbb');

    var privateKey = forge.pki.ed25519.privateKeyFromAsn1(
        forge.asn1.fromDer(forge.util.createBuffer(testcaseBuffer)));

    var md = forge.md.sha1.create();
    md.update(message.bytes(), 'raw');

    var signature = forge.pki.ed25519.sign({md: md, privateKey: privateKey.privateKeyBytes});
}


module.exports = { processTestcase };
