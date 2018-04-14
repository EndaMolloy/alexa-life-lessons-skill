'use strict';
const Alexa = require("alexa-sdk");
const axios = require("axios");
const awsSDK = require('aws-sdk');
awsSDK.config.update({region: 'eu-west-1'});
const {promisify} = require('es6-promisify');

const appId = 'amzn1.ask.skill.d4e0cdd4-fbf4-4b3d-abe0-dc75a390d128';
const favoriteLessonsTable = 'favoriteLessons';
const docClient = new awsSDK.DynamoDB.DocumentClient();


// For detailed tutorial on how to making a Alexa skill,
// please visit us at http://alexa.design/build

const SKILL_NAME = 'Life Lessons';
const HELP_MESSAGE = 'You can say give me a life lesson, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';
var todaysLesson = '';

exports.handler = function(event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = appId;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {



    'LaunchRequest': function () {
      //this.response.speak(welcomeOutput).listen(welcomeReprompt);
      this.emit('GetNewLessonIntent');
    },
    'GetNewLessonIntent': function () {
      // axios.get(`https://spreadsheets.google.com/feeds/list/1eDComL5qWGUo_aC07-T-rIAzS-mPZ3ctxBkEJwbGZS0/od6/public/basic?alt=json`)
      // .then(response => {
      //   console.log(response.data.feed.entry[1].title.$t);
      //
      //   todaysLesson = response.data.feed.entry[1].title.$t;
      //   this.response.speak(todaysLesson).shouldEndSession(false);
      //   this.emit(':responseReady');
      // })
      // .catch(error => {
      //   console.log(error);
      // })
      todaysLesson = 'hello mate';
      this.response.speak(todaysLesson).shouldEndSession(false);
      this.emit(':responseReady');
    },
    'AddFavoriteLessonIntent': function(){
      const params = {
       TableName: favoriteLessonsTable,
       Item: {
         "Title": 'The Wolf and his Shadow',
         "lessonText": 'Hello mister wolf, I am your shadow'
       }
      };

      // const checkIfLesson = {
      //   TableName: favoriteLessonsTable,
      //   Key: {
      //     Title: 'The Wolf and his Shadow',
      //     lessonText: 'Hello mister wolf, I am your shadow'
      //   }
      // }

      // dbPut(params).then(data => {
      //   console.log("PutItem succeeded: The Wolf Hahaha");
      //   this.emit(':tell', 'The wolf and his shadow has been added to your favorites');
      // })
      // .catch(err => {
      //   console.log(err);
      // })
      //  console.log('Attempting to add recipe', params);
      //
      docClient.put(params).promise()
      .then(data => {
          console.log("data added successfully", data);
          this.emit(':tell', 'The wolf and his shadow has been added to your favorites')
      })
      .catch(err => {
          console.log(err);
      });

      //  docClient.get(checkIfLesson, function(err,data){
      //    console.log('found lesson', data);
       //
      //    if(data.Item){
      //      const errMessage = `${data.Item.Title} is already favorited`;
      //      this.emit(':tell', errMessage);
      //    }
      //    else{
      //      docClient.put(params, function(err,data) => {
      //        if(data){
      //          console.log("data added successfully", data);
      //          this.emit(':tell', 'The wolf and his shadow has been added to your favorites')
      //        }
      //      });
      //    }
      //  })
      //  .then(data =>{
      //    console.log("data added successfully", data);
      //    this.emit(':tell', 'The wolf and his shadow has been added to your favorites')
      //  })
      //  .catch(err => {
      //    console.log(err);
      //  })
    },
    'RepeatLessonIntent': function(){
      this.response.speak(todaysLesson);
      this.emit(':responseReady');
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
