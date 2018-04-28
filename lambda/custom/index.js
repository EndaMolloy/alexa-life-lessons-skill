'use strict';
const Alexa = require("alexa-sdk");
const axios = require("axios");
const awsSDK = require('aws-sdk');
awsSDK.config.update({region: 'eu-west-1'});
const {formatSheet} = require('./GSformat');

const appId = 'amzn1.ask.skill.d4e0cdd4-fbf4-4b3d-abe0-dc75a390d128';
const favoriteLessonsTable = 'favoriteLessons';
const docClient = new awsSDK.DynamoDB.DocumentClient();


const SKILL_NAME = 'Life Lessons';
const HELP_MESSAGE = 'You can say give me a life lesson, ask me for my favorites or, you can say exit... What can I help you with?';
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

    'NewSession': function() {

      const today = new Date();

      if(this.attributes['timestamp']){ //user has used the app before
        const previousDate = new Date(this.attributes['timestamp']);
        const launchCount = this.attributes['launchCount'];

        if(today.toDateString() !== previousDate.toDateString()){
          this.attributes['launchCount'] = parseInt(launchCount) + 1;
        }
      }
      else{
        this.attributes['launchCount'] = 0;
      }

      this.attributes['timestamp'] = today;

      this.emit('GetNewLessonIntent');

    },


    'LaunchRequest': function () {
      //this.response.speak(welcomeOutput).listen(welcomeReprompt);
      this.emit('GetNewLessonIntent');
    },
    'GetNewLessonIntent': function () {

      const count = this.attributes['launchCount'];


      let introSay = '';

      if(count == 0 && this.attributes['timestamp'] == new Date()){
        introSay = "Welcome to life lessons, where each day you will be provided with a short lesson to help you reflect on " +
        "situations which will arise throughout your life. To listen to a lesson again after it has finished you can simply " +
        "ask for it to be repeated. You can also save a lesson to your " + "favorites, list your favorited lessons and of course lessons from favorites. Today\'s lesson is called";
      }
      else{
        introSay = 'Today\'s lesson is called';
      }

      axios.get(`https://spreadsheets.google.com/feeds/list/1eDComL5qWGUo_aC07-T-rIAzS-mPZ3ctxBkEJwbGZS0/od6/public/basic?alt=json`)
      .then(response => {

        const responseArray = formatSheet(response.data.feed.entry);

        todaysLessonTitle = responseArray[count].title;
        todaysLessonContent = responseArray[count].lesson;

        this.response.speak(`${introSay} <p>${todaysLessonTitle}</p><p>${todaysLessonContent}</p>`).shouldEndSession(false);
        this.emit(':responseReady');

      })
      .catch(error => {
        console.log(error);
      })
    },
    'AddFavoriteLessonIntent': function(){

      const { userId } = this.event.session.user;
      const params = {
       TableName: favoriteLessonsTable,
       Item: {
         "lessonTitle": todaysLessonTitle.toLowerCase(),
         "lessonText": todaysLessonContent.toLowerCase(),
         'UserId': userId
       }
      };

      const checkIfSaved = {
        TableName: favoriteLessonsTable,
        Key: {
          'lessonTitle': todaysLessonTitle.toLowerCase(),
          'UserId': userId
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
      let list = '<p>Your favorited lessons are:</p>';
      const params = {
        TableName: favoriteLessonsTable
      };

      docClient.scan(params).promise()
      .then(data => {
          console.log("scan succeeded");
          data.Items.forEach(lesson => {
            console.log(lesson.lessonTitle);
            list += `<p>${lesson.lessonTitle}</p>`;
          })

          if(data.Items){
            this.response.speak(list);
          }
          else{
            this.response.speak('Looks liked you haven\'t any saved favorites yet');
          }
          this.emit(':responseReady');
      })
      .catch(err => {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      })
    },

    'GetFavoritedLessonIntent': function(){

        //the lesson to retrieve
        const lessonSlot = this.event.request.intent.slots.LESSON_TITLE.value;
        console.log(lessonSlot);

        const params = {
          TableName: favoriteLessonsTable,
          Key: {
            'lessonTitle': lessonSlot,
            'UserId': userId
          }
        }

        console.log('Attempting to find lesson');

         docClient.get(params).promise()
         .then(data => {
           console.log('Lesson found');
           console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
           console.log(`${data.Item.lessonTitle}`);

           this.response.speak(`<p>${data.Item.lessonTitle}</p><p>${data.Item.lessonText}</p>`);
           this.emit(':responseReady');
         })
         .catch(err => {
           console.error("Unable to get the lesson. Error JSON:", JSON.stringify(err, null, 2));
         })

    },

    'DeleteFavoritedLessonIntent': function(){

        //the lesson to delete
        const lessonSlot = this.event.request.intent.slots.LESSON_TITLE.value;
        console.log(lessonSlot);

        const params = {
          TableName: favoriteLessonsTable,
          Key: {
            'lessonTitle': lessonSlot,
            'UserId': userId
          },
          ReturnValues: 'ALL_OLD'
        }

        console.log('Attempting to delete the lesson');

         docClient.delete(params).promise()
         .then(data => {
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));

           this.response.speak(`<p>${data.Attributes.lessonTitle}</p> has been deleted`);
           this.emit(':responseReady');
         })
         .catch(err => {
           console.error("Unable to get the lesson. Error JSON:", JSON.stringify(err, null, 2));
         })

    },
    'SessionEndedRequest' : function() {
        console.log('Session ended with reason: ' + this.event.request.reason);
    },
    'AMAZON.StopIntent' : function() {
        this.response.speak('Bye bye');
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
