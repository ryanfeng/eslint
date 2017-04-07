/**
 * @fileoverview An opinionated wrapper around eslint-fuzzer
 * @author Teddy Katz
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const ProgressBar = require("progress");
const fuzz = require("./eslint-fuzzer");
const eslint = require("..");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

// An estimate of how many times faster it is to do a crash-only fuzzer run versus an autofixing run.
const ESTIMATED_CRASH_AUTOFIX_PERFORMANCE_RATIO = 4;

// The number of crash-only tests to run for each autofix test. Right now, this is mostly arbitrary.
const CRASH_AUTOFIX_TEST_COUNT_RATIO = 3;

//------------------------------------------------------------------------------
// Public API
//------------------------------------------------------------------------------

/**
 * Runs the fuzzer and outputs a progress bar
 * @param {Object} [options] Options for the fuzzer
 * @param {number} [options.amount=300] A positive integer indicating how much testing to do. Larger values result in a higher
 * chance of finding bugs, but cause the testing to take longer (linear increase). With the default value, the fuzzer
 * takes about 15 seconds to run.
 * @returns {Object[]} A list of objects, where each object represents a problem detected by the fuzzer. The objects have the same
 * schema as objects returned from eslint-fuzzer.
 */
function run(options) {
    const amount = options && options.amount || 300;

    const crashTestCount = amount * CRASH_AUTOFIX_TEST_COUNT_RATIO;
    const autofixTestCount = amount;

    /*
     * To keep the progress bar moving at a roughly constant speed, apply a different weight for finishing
     * a crash-only fuzzer run versus an autofix fuzzer run.
     */
    const progressBar = new ProgressBar(
        "Fuzzing rules [:bar] :percent, :elapseds elapsed, eta :etas",
        { width: 30, total: crashTestCount + autofixTestCount * ESTIMATED_CRASH_AUTOFIX_PERFORMANCE_RATIO }
    );

    // Start displaying the progress bar.
    progressBar.tick(0);

    const crashTestResults = fuzz({
        eslint,
        count: crashTestCount,
        checkAutofixes: false,
        progressCallback: () => progressBar.tick(1)
    });

    const autofixTestResults = fuzz({
        eslint,
        count: autofixTestCount,
        checkAutofixes: true,
        progressCallback: () => progressBar.tick(ESTIMATED_CRASH_AUTOFIX_PERFORMANCE_RATIO)
    });

    return crashTestResults.concat(autofixTestResults);

}

module.exports = { run };
