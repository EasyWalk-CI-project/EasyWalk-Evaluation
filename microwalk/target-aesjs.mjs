import * as microwalk from './microwalk.mjs';
import aesjs from 'aes-js';

function processCipherTestcase(testcaseBuffer, subtarget)
{
    const message = new Uint8Array([1, 1, 2, 2, 3, 3, 4, 4, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 5, 5, 6, 6, 7, 7, 8, 8]);
    const iv =      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

	const key = new Uint8Array(testcaseBuffer);

    // Encryption
    let aes;
    switch(subtarget)
    {
        case targetInfo.subtargets.ecb128:
        case targetInfo.subtargets.ecb192:
        case targetInfo.subtargets.ecb256:
            aes = new aesjs.ModeOfOperation.ecb(key); break;
        case targetInfo.subtargets.ctr:
            aes = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(1)); break;
        case targetInfo.subtargets.cbc:
            aes = new aesjs.ModeOfOperation.cbc(key, iv); break;
        case targetInfo.subtargets.cfb:
            aes = new aesjs.ModeOfOperation.cfb(key, iv, subtarget.segmentSize); break;
        case targetInfo.subtargets.ofb:
            aes = new aesjs.ModeOfOperation.ofb(key, iv); break;
        
        default: throw new Error(`Unknown subtarget ${subtarget}`);
    }

    let encryptedBytes = aes.encrypt(message);
    microwalk.print_buffer(encryptedBytes);

    // Decryption
    switch(subtarget)
    {
        case targetInfo.subtargets.ecb128:
        case targetInfo.subtargets.ecb192:
        case targetInfo.subtargets.ecb256:
            aes = new aesjs.ModeOfOperation.ecb(key); break;
        case targetInfo.subtargets.ctr:
            aes = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(1)); break;
        case targetInfo.subtargets.cbc: 
            aes = new aesjs.ModeOfOperation.cbc(key, iv); break;
        case targetInfo.subtargets.cfb:
            aes = new aesjs.ModeOfOperation.cfb(key, iv, subtarget.segmentSize); break;
        case targetInfo.subtargets.ofb:
            aes = new aesjs.ModeOfOperation.ofb(key, iv); break;

        default: throw new Error(`Unknown subtarget ${subtarget}`);
    }

    let decryptedBytes = aes.decrypt(encryptedBytes);
    microwalk.print_buffer(decryptedBytes);
}

function processUtilTestcase(testcaseBuffer, subtarget)
{
    switch(subtarget)
    {
        case targetInfo.subtargets.utilHex:
            const inputStr = testcaseBuffer.toString("utf-8");
            const data = aesjs.utils.hex.toBytes(inputStr);
            const newStr = aesjs.utils.hex.fromBytes(data);

            console.log("    in:", inputStr);
            console.log("    out:", newStr);
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
        ecb128: { testcaseCount: 16, generateOptions: { length: 16 } },
        ecb192: { testcaseCount: 16, generateOptions: { length: 24 } },
        ecb256: { testcaseCount: 16, generateOptions: { length: 32 } },
        ctr: { testcaseCount: 16 },
        cbc: { testcaseCount: 16 },
        cfb: { testcaseCount: 16, segmentSize: 16 },
        ofb: { testcaseCount: 16 },

        utilHex: { 
            testcaseCount: 16,
            process: processUtilTestcase,
            generate: microwalk.generateRandomBytesHex,
            generateOptions: { length: 64 }
        }
    }
};
