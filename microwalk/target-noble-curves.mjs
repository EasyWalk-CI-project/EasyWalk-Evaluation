import * as microwalk from './microwalk.mjs';

import { secp256k1, schnorr } from '@noble/curves/secp256k1';
import { secp256r1 } from '@noble/curves/p256';
import { secp384r1 } from '@noble/curves/p384';
import { secp521r1 } from '@noble/curves/p521';
import { ed25519, x25519 } from '@noble/curves/ed25519';
import { ed448, x448 } from '@noble/curves/ed448';

function processTestcaseECDSA(testcaseBuffer, subtarget)
{
    const msg = new Uint8Array(32).fill(0x42);
    const priv = new Uint8Array(testcaseBuffer);

    let sig;
    let valid;
    let curve;
    switch(subtarget)
    {
        case targetInfo.subtargets.secp256k1:
            curve = secp256k1; break;
        case targetInfo.subtargets.secp256r1:
            curve = secp256r1; break;
        case targetInfo.subtargets.secp384r1:
            curve = secp384r1; break;
        case targetInfo.subtargets.secp521r1:
            curve = secp521r1; break;

        default:
            throw new Error(`Unknown subtarget ${subtarget}`);
    }

    const pub = curve.getPublicKey(priv);
    sig = curve.sign(msg, priv);
    valid = curve.verify(sig, msg, pub) === true;

    microwalk.print_buffer(sig.toCompactRawBytes(), "sig");
    console.log("    valid:", valid);
}

function processTestcaseECDH(testcaseBuffer, subtarget)
{
    const priv = new Uint8Array(testcaseBuffer.subarray(0, 32));
    const pub = new Uint8Array(testcaseBuffer.subarray(32));

    const shared = secp256k1.getSharedSecret(priv, pub);

    microwalk.print_buffer(shared, "shared");
}

function processTestcaseSchnorr(testcaseBuffer, subtarget)
{
    const msg = new TextEncoder().encode("Test!");
    const priv = new Uint8Array(testcaseBuffer);
    const pub = schnorr.getPublicKey(priv);

    let sig = schnorr.sign(msg, priv);
    let valid = schnorr.verify(sig, msg, pub) === true;

    microwalk.print_buffer(sig, "sig");
    console.log("    valid:", valid);
}

function processTestcaseEd(testcaseBuffer, subtarget)
{
    const msg = new TextEncoder().encode("Test!");
    const priv = new Uint8Array(testcaseBuffer);

    let curve;
    switch(subtarget)
    {
        case targetInfo.subtargets.ed25519:
            curve = ed25519; break;
        case targetInfo.subtargets.ed448:
            curve = ed448; break;

        default:
            throw new Error(`Unknown subtarget ${subtarget}`);
    }

    const pub = curve.getPublicKey(priv);
    let sig = curve.sign(msg, priv);
    let valid = curve.verify(sig, msg, pub) === true;

    microwalk.print_buffer(sig, "sig");
    console.log("    valid:", valid);
}

function processTestcaseX(testcaseBuffer, subtarget)
{
    let curve;
    let keyLength;
    switch(subtarget)
    {
        case targetInfo.subtargets.x25519:
            curve = x25519; keyLength = 32; break;
        case targetInfo.subtargets.x448:
            curve = x448; keyLength = 56; break;

        default:
            throw new Error(`Unknown subtarget ${subtarget}`);
    }

    const priv = new Uint8Array(testcaseBuffer.subarray(0, keyLength));
    const pub = new Uint8Array(testcaseBuffer.subarray(keyLength));

    const shared = curve.getSharedSecret(priv, pub);

    microwalk.print_buffer(shared, "shared");
}

export const targetInfo = {
    subtargets: {
        dummy: { testcaseCount: 2, generate: microwalk.generateRandomBytes, generateOptions: { length: 16 }, process: () => {} },
        secp256k1: {
            testcaseCount: 16,
            process: processTestcaseECDSA,
            generate: async () => Buffer.from(secp256k1.utils.randomPrivateKey())
        },
        secp256r1: {
            testcaseCount: 16,
            process: processTestcaseECDSA,
            generate: async () => Buffer.from(secp256r1.utils.randomPrivateKey())
        },
        secp384r1: {
            testcaseCount: 16,
            process: processTestcaseECDSA,
            generate: async () => Buffer.from(secp384r1.utils.randomPrivateKey())
        },/*
        secp521r1: {
            testcaseCount: 16,
            process: processTestcaseECDSA,
            generate: async () => Buffer.from(secp521r1.utils.randomPrivateKey())
        }*/
        ecdh: {
            testcaseCount: 16,
            process: processTestcaseECDH,
            generate: async () => Buffer.concat([Buffer.from(secp256k1.utils.randomPrivateKey()), Buffer.from(secp256k1.getPublicKey(secp256k1.utils.randomPrivateKey()))])
        },
        schnorr: {
            testcaseCount: 16,
            process: processTestcaseSchnorr,
            generate: async () => Buffer.from(schnorr.utils.randomPrivateKey())
        },
        ed25519: {
            testcaseCount: 16,
            process: processTestcaseEd,
            generate: async () => Buffer.from(ed25519.utils.randomPrivateKey())
        },
        x25519: {
            testcaseCount: 16,
            process: processTestcaseX,
            generate: async () => Buffer.concat([Buffer.from(x25519.utils.randomPrivateKey()), Buffer.from(x25519.getPublicKey(x25519.utils.randomPrivateKey()))])
        },
        ed448: {
            testcaseCount: 16,
            process: processTestcaseEd,
            generate: async () => Buffer.from(ed448.utils.randomPrivateKey())
        },
        x448: {
            testcaseCount: 16,
            process: processTestcaseX,
            generate: async () => Buffer.concat([Buffer.from(x448.utils.randomPrivateKey()), Buffer.from(x448.getPublicKey(x448.utils.randomPrivateKey()))])
        }
    }
};