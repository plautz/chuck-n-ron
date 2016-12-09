var http = require('http');

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function(event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        if (event.session.new) {
            onSessionStarted({
                requestId: event.request.requestId
            }, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("GetJoke" === intentName) {
        console.log("Retrieved 'GetJoke' intent...");
        getJokeResponse(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        getStopResponse(callback);
    } else {
        getUnknownIntentResponse(callback);
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

// --------------- Functions that control the skill's behavior -----------------------

function getJokeResponse(intent, session, callback) {
    var sessionAttributes = {};
    var cardTitle = "Joke"
    var repromptText = "";
    var shouldEndSession = true;
    var speechOutput = "";

    console.log("Calling Chuck Norris joke function...");
    getChuckNorrisJoke(function(joke) {
        console.log("Chuck Norris API callback... Response: " + joke);
        speechOutput = joke;
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
}

function getWelcomeResponse(callback) {
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the Chuck Norris joke teller. Ask me to get a Chuck Norris joke.";
    var repromptText = "Are you still there? Chuck Norris jokes don't tell themselves you know... well maybe they do. Either way, try again.";
    var shouldEndSession = false;

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getStopResponse(callback) {
    var sessionAttributes = {};
    var cardTitle = "Goodbye";
    var speechOutput = "Chuck Norris says goodbye";
    var repromptText = "";
    var shouldEndSession = true;

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getUnknownIntentResponse(callback) {
    var sessionAttributes = {};
    var cardTitle = "Excuse Me?";
    var speechOutput = "Even Chuck Norris couldn't understand what you just said. Try again.";
    var repromptText = "Are you still there? Chuck Norris jokes don't tell themselves you know... well maybe they do. Either way, try again.";    
    var shouldEndSession = false;

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// --------------- Helpers that build all of the responses -----------------------

function getChuckNorrisJoke(callback) {
    console.log("Chuck Norris API function entrance...");
    http.get({
        host: 'api.icndb.com',
        path: '/jokes/random'
    }, function(response) {
        var body = '';

        response.on('data', function(data) {
            body += data;
        });

        response.on('end', function() {
            console.log("Chuck Norris API call 'end'...");
            var parsed = JSON.parse(body);
            callback(parsed.value.joke);
        });
        
        response.on('error', function() {
            console.log("Chuck Norris API call 'error'...");
            callback("I couldn't get you a joke at this time, check your internet connection or the API endpoint, then try again.");
        });
    });
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
