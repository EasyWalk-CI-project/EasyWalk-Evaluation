#!/bin/bash

set -e

thisDir=$(pwd)
mainDir=$(realpath $thisDir/..)
resultsMainDir=$thisDir/results

coverageMainDir=$thisDir/coverage

htmlReportsDir=$resultsMainDir/html

mkdir -p $resultsMainDir
reports=""

mkdir -p $coverageMainDir

# Find all target files (*.js, *.mjs), while ignoring instrumented versions (*.mw.js, *.mw.mjs)
targets=$(find . -type f \( -iname "target-*.js" -o -iname "target-*.mjs" \) -print | grep -P '^(?!.*(\.mw\.[cm]?js$))' || true)
for target in $targets
do
  targetFileName=$(basename -- $target)
  targetName=$(basename -- ${target%.*})

  export MW_TARGET_NAME=$targetFileName
  
  testcaseDirectory=$thisDir/testcases/$targetName
  traceDirectory=$thisDir/traces/$targetName
  mapsDirectory=$thisDir/maps/$targetName
  resultsDirectory=$resultsMainDir/$targetName
  coverageDirectory=$thisDir/coverage-tmp/$targetName

  echo "Extracting subtargets from target ${targetName}..."
  cd $mainDir
  subtargets=$(node $thisDir/index.mjs subtargets)
  for subtarget in $subtargets
  do
    echo "Handling subtarget ${targetName}/${subtarget}..."
    cd $mainDir

    # Set up directory structure and corresponding environment variables
    export MW_TESTCASE_DIRECTORY=$testcaseDirectory/$subtarget
    export MW_TRACE_DIRECTORY=$traceDirectory/$subtarget
    export MW_MAPS_DIRECTORY=$mapsDirectory/$subtarget
    export MW_RESULTS_DIRECTORY=$resultsDirectory/$subtarget
    export MW_PATH_PREFIX=$mainDir
    subtargetCoverageDir=$coverageDirectory/$subtarget

    mkdir -p $MW_TESTCASE_DIRECTORY
    mkdir -p $MW_TRACE_DIRECTORY
    mkdir -p $MW_MAPS_DIRECTORY
    mkdir -p $MW_RESULTS_DIRECTORY
    mkdir -p $subtargetCoverageDir

    # Generate testcases
    echo "Generating testcases for target ${targetName}/${subtarget}..."
    time node $thisDir/index.mjs generate "${subtarget}"
    
    # Execute and trace target
    echo "Executing and tracing target ${targetName}/${subtarget}..."
    time node --max-old-space-size=16384 $JSTRACER_PATH/run.js $thisDir/index.mjs trace "${subtarget}"

    # Compute coverage and copy temporary results
    echo "Generating coverage of target ${targetName}/${subtarget}..."
    c8 --temp-directory $subtargetCoverageDir --exclude-node-modules false node $thisDir/index.mjs trace "${subtarget}"

    # C8 tends to generate multiple coverage files, one for every subprocess.
    # We pick the one that has "file:///" in its contents
    cd $subtargetCoverageDir
    coverageFile=$(grep -l "file:///" *.json)
    if [ $(echo "$coverageFile" | wc -l) -ne 1 ]; then
      echo "Error: More than one coverage file found for target ${targetName}/${subtarget}"
      exit 1
    fi

    # Move and rename coverage file
    mv "$coverageFile" "${coverageMainDir}/${targetName}_${subtarget}.json"
    
    # Invoke Microwalk
    cd $MICROWALK_PATH
    time dotnet Microwalk.dll $thisDir/config-preprocess.yml
    time dotnet Microwalk.dll $thisDir/config-analyze.yml
    
    # Generate CI report
    echo "Generating CI report for target ${targetName}/${subtarget}..."
    cd $CQR_GENERATOR_PATH
    dotnet CiReportGenerator.dll $MW_RESULTS_DIRECTORY/call-stacks.json "${targetName}/${subtarget}" $MW_RESULTS_DIRECTORY/report-$targetName-$subtarget.json gitlab-code-quality js-map $MW_MAPS_DIRECTORY
    reports="${reports} ${MW_RESULTS_DIRECTORY}/report-${targetName}-${subtarget}.json"
  done
done

# Merge CI reports
cat $reports | jq -s 'add' > $resultsMainDir/report.json

# Generate HTML reports
node $JSTRACER_PATH/code_quality_html_generation.mjs $resultsMainDir/report.json $coverageMainDir $mainDir $htmlReportsDir || echo "HTML report generation failed"