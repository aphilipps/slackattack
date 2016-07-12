// example bot
import botkit from 'botkit';

const Yelp = require('yelp');
let foodType;
let location;

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

// example hello response
controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
  console.log('Sent message');
});


// regex pulled from http://stackoverflow.com/questions/6711971/regular-expressions-match-anything
controller.hears(['help'], ['direct_message', 'direct_mention'], (bot, message) => {
  bot.reply(message, 'I can only do a few things, if you want food recommendations, type `hungry`');
  console.log('Sent message');
});

controller.hears(['[^]*'], ['direct_message', 'direct_mention'], (bot, message) => {
  bot.reply(message, 'What did you say?');
  console.log('Sent message');
});


// controller.on('user_typing', (bot, message) => {
//   bot.reply(message, 'stop typing!');
// });

const yelp = new Yelp({
  consumer_key: process.env.YELP_CONSUMER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token: process.env.YELP_TOKEN,
  token_secret: process.env.YELP_TOKEN_SECRET,
});

const askWhere = (response, convo) => {
  let attachment;
  convo.ask('Where are you?', (answer, talk) => {
    convo.say('Cool.');
    location = answer.text;
    console.log(answer.text);

    yelp.search({ term: foodType, location })
    .then((data) => {
      console.log(data);
      // data.businesses.foreach(business => {
        // if (data.business.si.name.indexOf(foodType) !== -1) {
      console.log('Found one');
      if (data.businesses === undefined) {
        convo.say('Couldn\'t find any restaurantes near you');
        convo.next();
      } else {
        attachment = {
          text: `Rating: ${data.businesses[0].rating}`,
          attachments: [
            {
              title: data.businesses[0].name,
              title_link: data.businesses[0].url,
              text: data.businesses[0].snippet_text,
              color: '#7CD197',
              image_url: data.businesses[0].image_url,
            },
          ],
        // thumb_url: data.businesses[0].image_url,
        };
        console.log('HERE IS THE ATTACHMENT YOU ARE GOING TO SEND');
        console.log(attachment);
        // console.log(answer);
        convo.say(attachment);
        convo.next();
      }
    })
    .catch((err) => {
      console.error(err);
    });
  });
};

const askType = (response, convo) => {
  convo.ask('What kind of food are you interested in?', (answer, talk) => {
    convo.say('Ok.');
    console.log(answer.text);
    foodType = answer.text;
    askWhere(response, convo);
    convo.next();
  });
};

// patterns pulled from https://github.com/howdyai/botkit#botreply
controller.hears(['hungry'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  // start a conversation to handle this response.
  bot.startConversation(message, (err, convo) => {
    convo.ask('Would you like food recommendations near you?', [
      {
        pattern: bot.utterances.yes,
        callback(answer, talk) {
          convo.say('Great');
          askType(answer, talk);
          convo.next();
        },
      },
      {
        pattern: bot.utterances.no,
        callback(answer, talk) {
          convo.say('Ok, maybe another time');
          convo.next();
        },
      },
      {
        default: true,
        callback(answer, talk) {
          // just repeat the question
          convo.repeat();
          convo.next();
        },
      },
    ]);
  });
});

controller.on('outgoing_webhook', (bot, message) => {
  console.log('received webhook');
  bot.replyPublic(message, 'CHIRP CHIRP CHIRP http://giphy.com/gifs/GBxUeCnzdgIHS/html5');
});

console.log('starting bot');
