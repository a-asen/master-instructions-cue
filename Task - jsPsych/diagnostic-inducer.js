////////////////////////////////////////////////////////
// CHANGE THESE BEFORE EXPERIMENT!

const debug = true              // Show some console information
const skip_instructions = true  // Skip intro? (to test trials)
const save_local_data = true    // Save a local file (test analysis)

////////////////////////////////////////////////////////

// Connection to server?
function saveData(name, data){
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'write_data.php'); // 'write_data.php' is the path to the php file described above.
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({filename: name, filedata: data}));
}


// Get data function
Date.prototype.today = function () { 
    return this.getFullYear() + "-" + (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"-"+ ((this.getDate() < 10)?"0":"") + this.getDate();
}
Date.prototype.timeNow = function () {
    return ((this.getHours() < 10)?"0":"") + this.getHours() +"-"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +"-"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}
var start_dateTime = new Date().today() + "_" + new Date().timeNow();
if(debug == true) { console.log(start_dateTime) }


////    Trials      ////
// Fixations
let short_fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => { return `<div style='font-size: ${fixation_size}'> + </div>` },
    choices: "NO_KEYS",
    trial_duration: short_fixation_delay, 
    data: { stimulus: "+", trial_info: "Fixation - short" },
} 
const long_fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus:  () => { return `<div style='font-size: ${fixation_size}'> + </div>` },
    choices: "NO_KEYS",
    trial_duration: long_fixation_delay, 
    data: { stimulus: "+", trial_info: "Fixation - long" },
}
// Feedback
const wrong_response = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus:  () => { return `<div style="font-size: ${general_font_size};"> Wrong response </div>` },
    choices: "NO_KEYS",
    trial_duration: wrong_response_delay,
    data: { stimulus: "Wrong response", trial_info: "Feedback" }
}
const too_slow = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => { return `<div style="font-size: ${general_font_size};"> Too slow </div>` },
    choices: "NO_KEYS",
    trial_duration: too_slow_delay, 
    data: { stimulus: "Too slow", trial_info: "Feedback" }
}
// change background
const set_background_colour_default = {
    type: jsPsychCallFunction,
    func: () => { changeBackground(default_background_colour) }
} 
const set_background_colour_wrong_response = {
    type: jsPsychCallFunction,
    func: () => { changeBackground(wrong_response_colour) },
}
  // https://github.com/jspsych/jsPsych/discussions/936
  // https://github.com/psychbruce/jspsych/blob/master/exp_demo/experiment/experiment.js


//
//
//  Initialize 
//
//

const jsPsych = initJsPsych({
    // experiment_width : 1280, 
        // w/e add later if necessary
    on_finish: function() {
        jsPsych.data.displayData() }
});
// Timeline start
const timeline = [];

timeline.push(set_background_colour_default) // To ensure the background colour is correct.

// About the experiment 
const about_the_experiment = {
    type: jsPsychInstructions,
    pages: [
        `WHAT ABOUT THIS EXPERIMETN; HUH?!` 
    ],
    data: { stimulus: "About the experiment", trial_info: "About the experiment" }
}
if(skip_instructions==true){} else { timeline.push(about_the_experiment) }

// Concent !!!
const concent = {
    type: jsPsychInstructions,
    pages: [
        `BY CLICKING NEXT YOU CONSENT TO THE EXPERIMENT -- bla bla
        
        Cancel at any time without any repercussions`
    ],
    
    data: {stimulus: "Instructions...."}
}
if(skip_instructions==true){} else { timeline.push(concent) }

// initialize fullscreen
if(skip_instructions==true){} else {
    timeline.push({
        type: jsPsychFullscreen,
        fullscreen_mode: true
    });
}

// Unique ID
let ID = jsPsych.randomization.randomID(8);
if(debug==true){ console.log("ID = " + ID) }

///////////////////////////////////////////////////////
////////////            TASK               ////////////
// Shuffle stimuli list
let rnd_stimuli = jsPsych.randomization.shuffle(stimuli);  // Shuffle stimuli list
if(debug==true) { console.log(rnd_stimuli) }

// Generate diagnostic length ranges
let diagnostic_range = Array.from(Array(diagnostic_max_length-3), (x,i) => i + diagnostic_min_length) 
if(debug==true){ console.log("The range of diagnostic lengths: ", diagnostic_range) }

// Generate probability distribution of the diagnostic run (if relevant)
if(math.toLowerCase() == "none"){
    final_probability_list = Array(diagnostic_max_length-(diagnostic_min_length-1)).fill(1)
} else {
    let halfway = (diagnostic_min_length+diagnostic_max_length)/2 //Diag halfway value
    if(debug==true){ console.log("Halway: ", halfway) }
    
    let probability_list = [];
    for(let i = 0; i < spare; i++){
        probability_list.push(1)
        if(debug==true){ console.log("Probability list: ", probability_list) }
    }
    
    for(let i = 1; i < Math.floor(halfway - diagnostic_min_length - spare) + 1; i++){
        // Start at 1 (cause it is the first distance)
        switch(math.toLowerCase()){
            case "log":
                probability_list.push(Number((1-(Math.log(1+i) * decent)).toFixed(2)))
                break;
            case "log2":
                probability_list.push(Number((1-(Math.log2(1+i) * decent)).toFixed(2)))
                break;
            case "log1p":
                probability_list.push(Number((1-(Math.log1p(1+i) * decent)).toFixed(2)))
                break;
            case "log10":
                probability_list.push(Number((1-(Math.log10(1+i) * decent)).toFixed(2)))
                break;
            case "linear":
                probability_list.push(Number((1-(i * decent)).toFixed(2)))
                break;
        }
    }
    if(diagnostic_range.length % 2 == 0){
        probability_list.unshift(1) 
        var final_probability_list = Object.assign([],probability_list).reverse().concat(probability_list); 
        // If it is even, then add 1 at the start
    } else {
        var final_probability_list = Object.assign([],probability_list).reverse().concat(1, probability_list); 
        // If odd add one in the middle
    }
}
if(debug==true){ console.log("Final probabilities are: ", final_probability_list) }

// Randomize diagnostic length across the experiment & distribute according to probability distribution
let rnd_diagnostic_length = [];
for(let i = 0; i < number_of_inducers; i++){
    rnd_diagnostic_length.push(jsPsych.randomization.sampleWithReplacement(diagnostic_range, 1,  final_probability_list)[0]);
    // We randomize the length from "min" to "max" with the probabilities in "final_probability_list"
}
if(debug==true){ console.log("With these parameters we end up with an average length of: ",  
(diagnostic_min_length+diagnostic_max_length)/2*number_of_inducers) }
if(debug==true){ console.log("Diag lengths: ", rnd_diagnostic_length) }
if(debug==true){ console.log("Experiment length: ", rnd_diagnostic_length.reduce((val, a) => val + a)) } // sum the list


////////        Experiment run creation         ////////
////    DIAGNOSTIC TASK    ////
let diagnostic_task_instruction_description = {
    type: jsPsychHtmlKeyboardResponse,
    pages: [
        `In the next screen you will see the instructions you are to execute when the target appears in black color `,,
        "You will have 20 seconds to remember the instructions. These instructions do not change over the experiment",
    ]
}

let rnd_diagnostic_responseSides = jsPsych.randomization.shuffle(responseSides);    // randomize response side 
        // Could/would probably be a good idea to randomize italic/upright appearance as well, but w/e
// Only displayed once, instruction remains the same throughout the experiment
let diagnostic_task_instruction = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function(){   
        let a = 
        `<p style="font-size: ${general_font_size};"> If a target appears <i> italic </i> press ${rnd_diagnostic_responseSides[0]}`+
        `<p style="font-size: ${general_font_size};"> If a target appeas upright press ${rnd_diagnostic_responseSides[1]}`; 
        return a;
    }, 
    prompt: "Press any key to continue",
    choices: "ALL_KEYS", 
    trial_duration: instruction_delay,
    data: {
        stimulus: `If italic press ${rnd_diagnostic_responseSides[0]} || If upright press ${rnd_diagnostic_responseSides[1]}`,
        trial_info: "Diagnostic instructions",
    },
    on_finish: () => {console.log(jsPsych.data.getLastTrialData())}
    //post_trial_gap: 1500,
}
timeline.push(diagnostic_task_instruction)


// Here we create the experiment
for(let i = 0; i < number_of_inducers; i++){ // less than, since we start at 0
    // This first get the number of different inducers
    let run_stimuli = [rnd_stimuli[0], rnd_stimuli[1]] // Get new stimuli
    rnd_stimuli.splice(0,2) // Remove those stimuli from the list
    let run_diagnostic_length = rnd_diagnostic_length[i] // Get the curret diagnostic length
    let rnd_inducer_responseSides = jsPsych.randomization.shuffle(responseSides); // randomize where left/right appears
    
    // Inducer instruction for this run
    let inducer_instruction = { 
        type: jsPsychHtmlKeyboardResponse,
        stimulus: () => {   
            return  `<p style="font-size: ${general_font_size};"> If ${run_stimuli[0]} press ${rnd_inducer_responseSides[0]}`+
                    `<p style="font-size: ${general_font_size};"> If ${run_stimuli[1]} press ${rnd_inducer_responseSides[1]}`; 
        }, 
        prompt: "Press any key to continue",
        choices: "ALL_KEYS", 
        data: {
            inducer_run: i,                 // Inducer run number
            stimulus: `If ${run_stimuli[0]} press ${rnd_inducer_responseSides[0]} || If ${run_stimuli[1]} press ${rnd_inducer_responseSides[1]}`,
            trial_info: "Inducer instructions"
        }, 
        trial_duration: instruction_delay, 
    }
    timeline.push(inducer_instruction)
    timeline.push(short_fixation)


    // Then we generate the diagnostic trials 
        // Should perhaps be a color? Or randomize a color? 
    for(let ii = 0; ii < run_diagnostic_length; ii++){
        let run_rnd_stimulus = jsPsych.randomization.sampleWithReplacement(run_stimuli, 1)[0]
        let run_rnd_italic = jsPsych.randomization.sampleWithReplacement([true,false], 1, run_italic_bias)[0]

        let diagnostic_run = { 
            type: jsPsychHtmlKeyboardResponse,
            stimulus: () => {   
                if(run_rnd_italic==true) {
                    return `<p style="font-size: ${general_font_size};"><i>${run_rnd_stimulus}</i>`
                } else {
                    return `<p style="font-size: ${general_font_size};">${run_rnd_stimulus}`
                }
            }, 
            choices: allowed_responses,
            trial_duration: trial_duration,
            data: {
                stimulus: run_rnd_stimulus,     // Stimulus - What is the stimulus?
                inducer_run: i,                 // Inducer run number
                diagnostic_run: ii,             // Diagnostic run number
                inducer_trial: false,           // Not an inducer trial
                italic: run_rnd_italic,         // Italic trial?
                trial_info: "Diagnostic trial", // General trial info
                correct_response_side: () => {  // The correct response side (if is italic, then resp side 0)
                    if (run_rnd_italic == true) { return rnd_diagnostic_responseSides[0] } 
                    else                        { return rnd_diagnostic_responseSides[1] } },
            },
            on_finish: (data) => {
                // Set the "correct_response_key"
                if(data.correct_response_side == responseSides[0]){
                    data.correct_response_key = allowed_responses[0]
                } else { 
                    data.correct_response_key = allowed_responses[1]}

                // Only if there is a response do we check whether it is correct. 
                if(data.response == null){
                    data.correct = null;
                } else {
                    // If response equals correct_response_key
                    if(data.correct_response_key == data.response)  { data.correct = true }
                    else                                            { data.correct = false }
                }

                // could add
                // data.inducer_required_response = 

                /// GONGUENCEY HERE
                // if they are the same in one position, then they are congruent?
                if(rnd_diagnostic_responseSides[0] == rnd_inducer_responseSides[0] & data.stimulus == run_stimuli[0]){
                        // If the diagnostic and inducer respond side overlapp, as well as the stimulus is equal to the run stimuli[0] THEN congruent 
                    data.congruency = true
                } else if (rnd_diagnostic_responseSides[1] == rnd_inducer_responseSides[1] & data.stimulus == run_stimuli[1]){
                    data.congruency = true
                } else { data.congruency = false }
            }
        }
        timeline.push(diagnostic_run)

        // If participants responded to slow, give feedback
        let too_slow_trial = {
            timeline: [set_background_colour_wrong_response, too_slow, set_background_colour_default],
            conditional_function: () => {
                let data = jsPsych.data.get().last(1).values()[0];
                if(data.response === null)  { return true } 
                else                        { return false }
            }
        }
        timeline.push(too_slow_trial)
        
        // If participants responded incorrectly, give feedback
        let wrong_response_trial = {
            timeline: [set_background_colour_wrong_response, wrong_response , set_background_colour_default],
            conditional_function: () => {
                let data = jsPsych.data.get().last(1).values()[0]
                if( data.correct == false)  { return true } 
                else                        { return false }
            }
        }
        timeline.push(wrong_response_trial)

        timeline.push(short_fixation)
    }

    /// INDUCERN TASK HERE
    let rnd_inducer_stimulus = jsPsych.randomization.sampleWithReplacement(run_stimuli, 1)[0]
    let rnd_inducer_colour = jsPsych.randomization.sampleWithReplacement(inducer_colours, 1)[0]

    let inducer_task = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: () => { return `<p style="font-size: ${general_font_size}; color:${rnd_inducer_colour}">${rnd_inducer_stimulus}` },
        choices: allowed_responses,
        trial_duration: trial_duration,
        data: {
            stimulus: rnd_inducer_stimulus,     // stimulus
            inducer_run: i,                     // Inducer run 
            inducer_trial: true,                // Inducer trial
            trial_info: "Inducer trial",        // General trial info
            correct_response_side: () => {      // Get response side, according to run_stimuli
                if(rnd_inducer_stimulus == run_stimuli[0]){ 
                    return rnd_inducer_responseSides[0] 
                } else { 
                    return rnd_diagnostic_responseSides[1]} },
        },
        on_finish: (data) => {
            // Find correct response key 
            if(data.correct_response_side == responseSides[0]){
                data.correct_response_key = allowed_responses[0] 
            } else { 
                data.correct_response_key = allowed_responses[1] }

            // Test whether the response is correct
            if(data.response == data.correct_response_key)  { data.correct = true }
            else                                            { data.correct = false }
        }
    }
    timeline.push(inducer_task)

    // If participants responded to slow, give feedback
    let too_slow_trial = {
        timeline: [set_background_colour_wrong_response, too_slow, set_background_colour_default],
        conditional_function: () => {
            let data = jsPsych.data.get().last(1).values()[0];
            if(data.response === null)  { return true } 
            else                        { return false }
        }
    }
    timeline.push(too_slow_trial)
    // If participants responded incorrectly, give feedback
    let wrong_response_trial = {
        timeline: [set_background_colour_wrong_response, wrong_response , set_background_colour_default],
        conditional_function: () => {
            let data = jsPsych.data.get().last(1).values()[0];
            if( data.correct == false)  { return true } 
            else                        { return false }
        }
    }
    timeline.push(wrong_response_trial)
        
    let inducer_fixation = {
        timeline: [long_fixation],
        conditional_function: () => {
            if(i < number_of_inducers)  { return true } 
            else                        { return false }
        }
    }
    timeline.push(inducer_fixation)
}


// Way too much to change to get the background colour gray
// So just set it to white
const white_bk = {
    type: jsPsychCallFunction,
    func: () => { changeBackground("white") }
} 
timeline.push(white_bk)
const demographics = {
    type: jsPsychSurvey,
    button_label_finish: "Next",
    required_question_label: "*",
    required_error: "Please check whether you responded to all the questions.",
    pages: [[
            {
                type: 'html',
                prompt: `You have now completed the central part of the experiment.<br>` +
                `To complete the study, please answer the following questions:`,
            },
            {
                type: 'multi-choice',
                prompt: "Gender", 
                name: 'gender', 
                options: ['Female', 'Male', 'Other', 'I would rather not tell.'], 
                required: true
            }, 
            {
                type: 'text',
                prompt: "What year were you born? (enter answer into text box below)", 
                name: 'yearBorn', 
                textbox_columns: 5,
                required: true,
            }
        ]],
    data: { stimulus: "Demographics", trial_info: "Demographics"}, 
    on_finish: () => {
        data = jsPsych.data.getLastTrialData().values()[0]
        
        jsPsych.data.get().addToAll({ gender:       data.response.gender });
        jsPsych.data.get().addToAll({ birthYear:    data.response.birthYear });
        jsPsych.data.get().addToAll({ id:           ID });

        // Save the data
        if(save_local_data==true){ jsPsych.data.get().localSave('csv','mydata.csv') }

        // Return data to server
        saveData("data_" + start_dateTime + "_" + ID, jsPsych.data.get().csv());
    }
}
timeline.push(demographics)
// var comments = {}

// exit fullscreen mode
    // before finish exit FS
timeline.push({
    type: jsPsychFullscreen,
    fullscreen_mode: false
}); 

var thanks = {}

jsPsych.run(timeline)
