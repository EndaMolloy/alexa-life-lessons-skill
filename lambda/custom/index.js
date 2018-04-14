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
var todaysLessonTitle = '';
var todaysLessonContent = '';

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
      axios.get(`https://spreadsheets.google.com/feeds/list/1eDComL5qWGUo_aC07-T-rIAzS-mPZ3ctxBkEJwbGZS0/od6/public/basic?alt=json`)
      .then(response => {
        console.log(response.data.feed.entry[1].title.$t);

        todaysLessonTitle = response.data.feed.entry[1].title.$t;
        todaysLessonContent = response.data.feed.entry[1].content.$t;

        this.response.speak(`Today\'s lesson is called <p>${todaysLessonTitle}</p><p>${todaysLessonContent}</p>`).shouldEndSession(false);
        this.emit(':responseReady');

      })
      .catch(error => {
        console.log(error);
      })
    },
    'AddFavoriteLessonIntent': function(){
      const params = {
       TableName: favoriteLessonsTable,
       Item: {
         "Title": todaysLessonTitle,
         "lessonText": todaysLessonContent
       }
      };

      const checkIfSaved = {
        TableName: favoriteLessonsTable,
        Key: {
          'Title': todaysLessonTitle
        }
      };

     //check to see if the lesson has already been saved to favorites
     docClient.get(checkIfSaved).promise()
       .then(data => {
         console.log("GetItem succeeded:", JSON.stringify(data, null, 2));

         if(data.Item){
           console.log("Item already exists in DB");
           this.emit(':tell', `${todaysLessonTitle} has already been added to your favorites`);
         }
         else {
           docClient.put(params).promise()
           .then(data => {
               console.log("data added successfully", data);
               this.emit(':tell', `${todaysLessonTitle} has been added to your favorites`);
           })
           .catch(err => {
               console.log(err);
           });
         }
       })
       .catch(err => {
         console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
       })
    },

    'RepeatLessonIntent': function(){
      this.response.speak(`<p>${todaysLessonTitle}</p><p>${todaysLessonContent}</p>`);
      this.emit(':responseReady');
    },

    'ListFavoritesIntent': function(){
      let list = '<p>Your saved lessons are:</p>';
      const params = {
        TableName: favoriteLessonsTable
      };

      docClient.scan(params).promise()
      .then(data => {
          console.log("scan succeeded");
          data.Items.forEach(lesson => {
            console.log(lesson.Title);
            list += `<p>${lesson.Title}</p>`;
          })

          this.response.speak(list);
          this.emit(':responseReady');
      })
      .catch(err => {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
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
