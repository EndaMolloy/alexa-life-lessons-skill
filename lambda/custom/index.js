'use strict';
const Alexa = require("alexa-sdk");
const axios = require("axios");
const {formatResponse} = require("./faaHelper");
const ENDPOINT = 'http://services.faa.gov/airport/status/';

// For detailed tutorial on how to making a Alexa skill,
// please visit us at http://alexa.design/build

const SKILL_NAME = 'Life Lessons';
const HELP_MESSAGE = 'You can say give me a life lesson, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';


exports.handler = function(event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    'LaunchRequest': function () {
      //this.response.speak(welcomeOutput).listen(welcomeReprompt);
      this.emit('GetNewLessonIntent');
    },
    'GetNewLessonIntent': function () {
      axios.get(`https://spreadsheets.google.com/feeds/list/1eDComL5qWGUo_aC07-T-rIAzS-mPZ3ctxBkEJwbGZS0/od6/public/basic?alt=json`)
      .then(response => {
        console.log(response.data.feed.entry[0].title.$t);

        const story = response.data.feed.entry[0].title.$t;
        this.response.speak(story);
        this.emit(':responseReady');
      })
      .catch(error => {
        console.log(error);
      })
    },
    'MyNameIsIntent': function () {
        this.emit('SayHelloName');
    },
    'SayHelloName': function () {
        var name = this.event.request.intent.slots.name.value;
        this.response.speak('Hello ' + name)
            .cardRenderer('hello world', 'hello ' + name);
        this.emit(':responseReady');
    },
    'SessionEndedRequest' : function() {
        console.log('Session ended with reason: ' + this.event.request.reason);
    },
    'AMAZON.StopIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent' : function() {
      const speechOutput = HELP_MESSAGE;
      const reprompt = HELP_REPROMPT;

      this.response.speak(speechOutput).listen(reprompt);
      this.emit(':responseReady');
    },
    'AMAZON.CancelIntent' : function() {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'Unhandled' : function() {
        this.response.speak("Sorry, I didn't get that.");
    }
};
