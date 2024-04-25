import * as microwalk from './microwalk.mjs';
import forge from 'node-forge';
import { execSync } from 'child_process';

var drngBuffer = 'abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd' +
    'abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd' +
    'abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd' +
    'abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd'

function processCipherTestcase(testcaseBuffer, subtarget)
{
    let message;
    const iv = forge.util.createBuffer();
	iv.putString('aaaabbbbcccc');
    let key;
    let cipher;
    let tag;
    let encrypted;

    // Encryption
    switch(subtarget)
    {
        case targetInfo.subtargets.aes_ecb:
            message = new forge.util.ByteBuffer([1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4]);
            key = new forge.util.ByteBuffer(testcaseBuffer);
            cipher = forge.cipher.createCipher('AES-ECB', key);
            cipher.start({});
            break;
        case targetInfo.subtargets.aes_gcm:
            message = forge.util.createBuffer();
            message.putString('aaaabbbbaaaabbbbaaaabbbbaaaabbbb');
            key = forge.util.createBuffer(testcaseBuffer);
            cipher = forge.cipher.createCipher('AES-GCM', key);
        	cipher.start({iv: iv.bytes(12)});
            break;       
        default: throw new Error(`Unknown subtarget ${subtarget}`);
    }
    cipher.update(message);
    cipher.finish();
    tag = cipher.mode.tag;
    encrypted = cipher.output;
}

function processUtilTestcase(testcaseBuffer, subtarget)
{
    let message;
    let b64message;
    let binary;

    switch(subtarget)
    {
        case targetInfo.subtargets.decode:
            message = forge.util.createBuffer(testcaseBuffer).toString();
	        binary = forge.util.decode64(message);
            break;
        case targetInfo.subtargets.encode:
            binary = forge.util.createBuffer(testcaseBuffer);
            b64message = forge.util.encode64(binary.data);
            break;
        default: throw new Error(`Unknown subtarget ${subtarget}`);
    }
}

function processSignTestcase(testcaseBuffer, subtarget)
{
    let message = forge.util.createBuffer();
    message.putString('aaaabbbbaaaabbbbaaaabbbbaaaabbbb');
    let md;
    let privateKey;
    let signature;

    switch(subtarget)
    {
        case targetInfo.subtargets.ed25519_sign:
            privateKey = forge.pki.ed25519.privateKeyFromAsn1(
                forge.asn1.fromDer(forge.util.createBuffer(testcaseBuffer)));
            md = forge.md.sha1.create();
            md.update(message.bytes(), 'raw');
            signature = forge.pki.ed25519.sign({md: md, privateKey: privateKey.privateKeyBytes});
            break;
        default: throw new Error(`Unknown subtarget ${subtarget}`);
    }
}

export const targetInfo = {
    process: processCipherTestcase,
    generate: microwalk.generateRandomBytes,
    generateOptions: { length: 16 },
    subtargets: {
        dummy: { testcaseCount: 2, generateOptions: { length: 16 }, process: () => {} },
        aes_ecb: { testcaseCount: 16 },
        aes_gcm: { testcaseCount: 16 },
        decode: { 
            testcaseCount: 16 ,
            process: processUtilTestcase,
            generate: microwalk.generateRandomBytesHex,
            generateOptions: { length: 64 }
        },
        encode: { 
            testcaseCount: 16 ,
            process: processUtilTestcase,
            generate: microwalk.generateRandomBytesHex,
            generateOptions: { length: 64 }
        },
        ed25519_sign: { 
            testcaseCount: 16,
            process: processSignTestcase,
            generate: async () => execSync("openssl genpkey -outform DER -algorithm ED25519")
        }
    }
};
