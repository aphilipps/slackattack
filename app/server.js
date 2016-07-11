// example bot
import botkit from 'botkit';

const Yelp = require('yelp');

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
controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
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

// const yelp = new Yelp({
//   consumer_key: '8pxAMuvJCfWZP1whqFP7TA',
//   consumer_secret: 'nGJeb4f5_6R1G1lRdJqoHHHfHdg',
//   token: 'B-tFWyA81U2P8AwdYK2Qy2jGGLjmXTPL',
//   token_secret: 'AAJhSueRz8VBOpHHDFIsb37cEjg',
// });

const yelp = new Yelp({
  consumer_key: process.env.YELP_CONSUMER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token: process.env.YELP_TOKEN,
  token_secret: process.env.YELP_TOKEN_SECRET,
});

const askWhere = (response, convo) => {
  convo.ask('Where are you?', (answer, talk) => {
    convo.say('Cool.');
    convo.next();
  });
};

controller.hears(['pizzatime'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  console.log('Starting conversation');
  bot.startConversation(message, askWhere);
});


//   bot.startConversation(message, askFlavor);
// });

// controller.hears(['pizzatime'], (bot, message) => {
//   bot.startConversation(message, askFlavor);
// });
// const askFlavor = (answer, convo) => {
//   convo.ask('What flavor of pizza do you want?', (answer, convo) => {
//     convo.say('Awesome.');
//     convo.next();
//   });
// };

controller.hears(['food', 'hi', 'howdy'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  yelp.search({ term: 'food', location: 'Montreal' })
  .then((data) => {
    console.log(data);
    data.businesses.forEach(business => {
      if (business.rating === 4) {
        bot.reply(message, `${business.name} is a prety good restaurant.`);
      }
    });
  })
  .catch((err) => {
    console.error(err);
  });
});

controller.on('outgoing_webhook', (bot, message) => {
  bot.replyPublic(message, 'CHIRP CHIRP CHIRP');
});

console.log('starting bot');
