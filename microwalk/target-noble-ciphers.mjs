import * as microwalk from './microwalk.mjs';

import { chacha20poly1305, xchacha20poly1305 } from '@noble/ciphers/chacha';
import { xsalsa20poly1305 } from '@noble/ciphers/salsa';
import { gcm, siv, ctr, cbc, ecb } from '@noble/ciphers/aes';
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils';

function processCipherTestcase(testcaseBuffer, subtarget)
{
    const message = new Uint8Array([1, 1, 2, 2, 3, 3, 4, 4, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 5, 5, 6, 6, 7, 7, 8, 8]);
    const key = new Uint8Array(testcaseBuffer.subarray(0, 32));
    const nonce = new Uint8Array(testcaseBuffer.subarray(32));

    let cipher;
    switch(subtarget)
    {
        case targetInfo.subtargets.chacha20poly1305:
            cipher = chacha20poly1305(key, nonce); break;
        case targetInfo.subtargets.xchacha20poly1305:
            cipher = xchacha20poly1305(key, nonce); break;
        case targetInfo.subtargets.xsalsa20poly1305:
            cipher = xsalsa20poly1305(key, nonce); break;

        case targetInfo.subtargets.aes256gcm:
            cipher = gcm(key, nonce); break;
        case targetInfo.subtargets.aes256siv:
            cipher = siv(key, nonce); break;
        case targetInfo.subtargets.aes256ctr:
            cipher = ctr(key, nonce); break;
        case targetInfo.subtargets.aes256cbc:
            cipher = cbc(key, nonce); break;
        case targetInfo.subtargets.aes256ecb:
            cipher = ecb(key); break;

        default:
            throw new Error(`Unknown subtarget ${subtarget}`);
    }

    let encrypted = cipher.encrypt(message);
    microwalk.print_buffer(encrypted, "enc");

    let decrypted = cipher.decrypt(encrypted);
    microwalk.print_buffer(decrypted, "dec");
}

function processUtilTestcase(testcaseBuffer, subtarget)
{
    switch(subtarget)
    {
        case targetInfo.subtargets.utilHex:
        {
            const inputStr = testcaseBuffer.toString("utf-8");
            const data = hexToBytes(inputStr);
            const newStr = bytesToHex(data);

            console.log("    in:", inputStr);
            console.log("    out:", newStr);

            break;
        }

        default:
            throw new Error(`Unknown subtarget ${subtarget}`);
    }
}

export const targetInfo = {
    process: processCipherTestcase,
    subtargets: {
        dummy: { testcaseCount: 2, generate: microwalk.generateRandomBytes, generateOptions: { length: 16 }, process: () => {} },
        chacha20poly1305: {
            testcaseCount: 16,
            generate: microwalk.generateRandomBytes,
            generateOptions: { length: 32 + 12 }
        },
        xchacha20poly1305: {
            testcaseCount: 16,
            generate: microwalk.generateRandomBytes,
            generateOptions: { length: 32 + 24 }
        },
        xsalsa20poly1305: {
            testcaseCount: 16,
            generate: microwalk.generateRandomBytes,
            generateOptions: { length: 32 + 24 }
        },
        aes256gcm: {
            testcaseCount: 16,
            generate: microwalk.generateRandomBytes,
            generateOptions: { length: 32 + 24 }
        },
        aes256siv: {
            testcaseCount: 16,
            generate: microwalk.generateRandomBytes,
            generateOptions: { length: 32 + 12 }
        },
        aes256ctr: {
            testcaseCount: 16,
            generate: microwalk.generateRandomBytes,
            generateOptions: { length: 32 + 16 }
        },
        aes256cbc: {
            testcaseCount: 16,
            generate: microwalk.generateRandomBytes,
            generateOptions: { length: 32 + 16 }
        },
        aes256ecb: {
            testcaseCount: 16,
            generate: microwalk.generateRandomBytes,
            generateOptions: { length: 32 }
        },

        utilHex: {
            testcaseCount: 16,
            process: processUtilTestcase,
            generate: microwalk.generateRandomBytesHex,
            generateOptions: { length: 64 }
        },
    }
};