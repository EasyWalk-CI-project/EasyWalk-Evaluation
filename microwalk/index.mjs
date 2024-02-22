/**
 * Wrapper for analysis of a target using Microwalk.
 * 
 * Ensure to call this from the root of the project (so all dependencies can be resolved), with the following environment variables set:
 * - MW_TARGET_NAME: The name of the current target.
 * - MW_TESTCASE_DIRECTORY: ("generate" and "trace") The directory containing the testcases.
 * - MW_TRACE_DIRECTORY: ("trace") The directory to write the traces to (used by the tracing engine).
 * 
 * Command line arguments:
 * - Action to perform:
 *   - "subtargets": List all subtargets of the current target.
 *   - "generate": Generate testcases.
 *     - <subtarget> The subtarget to generate the testcases for.
 *   - "trace": Execute testcases and generate traces.
 *     - <subtarget> The subtarget to generate the traces for.
 */

import fs from "node:fs/promises";
import * as microwalk from "./microwalk.mjs";

await microwalk.init();

// Ensure that environment variables are set
if(!process.env.MW_TARGET_NAME)
    microwalk.exit_with_error("Environment variable MW_TARGET_NAME is not set");

// Load target
const target = await import(`./${process.env.MW_TARGET_NAME}`);

// Parse command line arguments
if(process.argv.length < 3)
    microwalk.exit_with_error("Usage: <action> ...");
switch(process.argv[2])
{
    case "subtargets":
        __list_subtargets();
        break;
    case "generate":
        __generate_testcases();
        break;
    case "trace":
        __trace_testcases();
        break;
    default:
        microwalk.exit_with_error(`Unknown action: ${process.argv[2]}`);
}

function __list_subtargets()
{
    for(const subtarget in target.targetInfo.subtargets)
        console.log(`${subtarget}`);
}

async function __generate_testcases()
{
    if(!process.env.MW_TESTCASE_DIRECTORY)
        microwalk.exit_with_error("Environment variable MW_TESTCASE_DIRECTORY is not set");

    // Parse remaining command line arguments
    if(process.argv.length < 4)
        microwalk.exit_with_error("Usage: generate <subtarget>");
    const subtargetKey = process.argv[3];

    // Load subtarget
    const subtargetInfo = target.targetInfo.subtargets[subtargetKey];
    if(!subtargetInfo)
        microwalk.exit_with_error(`Could not find subtarget ${subtargetKey}`);
    
    let generateFunc = subtargetInfo.generate ?? target.targetInfo.generate;

    // Find test case generation function
    if(!generateFunc)
        microwalk.exit_with_error(`Could not determine testcase generation function for subtarget ${subtargetKey}`);
    if(typeof generateFunc !== "function")
        microwalk.exit_with_error(`Testcase generation setting for subtarget ${subtargetKey} is not a function`);

    // Retrieve test case generation function params, if any
    const generateFuncParams = target.targetInfo.generateOptions ?? {};
    Object.assign(generateFuncParams, subtargetInfo.generateOptions ?? {});

    // Ensure that testcase directory exists
    await fs.mkdir(process.env.MW_TESTCASE_DIRECTORY, {recursive: true}).catch(() => {});

    // Generate testcases
    for(let i = 0; i < subtargetInfo.testcaseCount; i++)
    {
        console.log(`Generating testcase ${i}`);

        // Set seed in case there are overrides of native functions
        microwalk.set_seed(subtargetInfo.testcaseCount + i);

        // Generate testcase
        const testcaseBuffer = await generateFunc(i, generateFuncParams, subtargetInfo, subtargetKey);

        // Write testcase file
        await fs.writeFile(`${process.env.MW_TESTCASE_DIRECTORY}/t${i}.testcase`, testcaseBuffer);
    }
}

async function __trace_testcases()
{
    if(!process.env.MW_TESTCASE_DIRECTORY)
        microwalk.exit_with_error("Environment variable MW_TESTCASE_DIRECTORY is not set");
    if(!process.env.MW_TRACE_DIRECTORY)
        microwalk.exit_with_error("Environment variable MW_TRACE_DIRECTORY is not set");

    // Parse remaining command line arguments
    if(process.argv.length < 4)
        microwalk.exit_with_error("Usage: trace <subtarget>");
    const subtargetKey = process.argv[3];

    // Load subtarget
    const subtargetInfo = target.targetInfo.subtargets[subtargetKey];
    if(!subtargetInfo)
        microwalk.exit_with_error(`Could not find subtarget ${subtargetKey}`);

    const processFunc = subtargetInfo.process ?? target.targetInfo.process;
    if(!processFunc)
        microwalk.exit_with_error(`Could not find processing function for subtarget ${subtargetKey}`);

    // Get list of testcase files; sort them by name, considering numbers contained in them
    const testcases = await fs.readdir(process.env.MW_TESTCASE_DIRECTORY);
    testcases.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

    // Execute first testcase early as trace prefix
    console.log(`Running testcase 0 as trace prefix`);
    console.log("  prefix begin");
    await processFunc(await fs.readFile(`${process.env.MW_TESTCASE_DIRECTORY}/${testcases[0]}`), subtargetInfo);
    console.log("  prefix end");

    // Execute all testcases
    for(let i = 0; i < testcases.length; i++)
    {
        console.log(`Running testcase ${i}`);

        // Read testcase file
        const testcaseBuffer = await fs.readFile(`${process.env.MW_TESTCASE_DIRECTORY}/${testcases[i]}`);

        // Process testcase
        console.log("  begin");
        __MICROWALK_testcaseBegin();
        await processFunc(testcaseBuffer, subtargetInfo);
        __MICROWALK_testcaseEnd();
        console.log("  end");
    }
}

// Marker functions for commmunicating testcase begin/end to the tracing engine.
function __MICROWALK_testcaseBegin() {}
function __MICROWALK_testcaseEnd() {}
