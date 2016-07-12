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
      data.businesses.forEach(business => {
        // if (business.name.indexOf(foodType) !== -1) {
        console.log('Found one');
        attachment = {
          text: `Rating: ${business.rating}`,
          attachments: [
            {
              title: business.name,
              text: business.snippet_text,
            },
          ],
          icon_url: 'http://s3-media3.fl.yelpcdn.com/photo/m6vlPsVGi9ln0hQM0LGylw/ms.jpg',
        };
        console.log('HERE IS THE ATTACHMENT YOU ARE GOING TO SEND');
        console.log(attachment);
        // console.log(answer);
        convo.say(attachment);
        // }
        // console.log('maybe didnt find one');
      });
    })
    .catch((err) => {
      console.error(err);
    });


    convo.next();
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

const askHungry = (response, convo) => {
  convo.ask('Would you like food recommendations near you?', (answer, talk) => {
    convo.say('Great');
    askType(response, convo);
    convo.next();
  });
};

controller.hears(['hungry'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  console.log('Starting conversation');
  bot.startConversation(message, askHungry, bot);
});


controller.on('outgoing_webhook', (bot, message) => {
  console.log('received webhook');
  bot.replyPublic(message, 'CHIRP CHIRP CHIRP');
});

console.log('starting bot');
