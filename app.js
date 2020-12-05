const axios = require('axios');
const cmlog = require('cmlog');
const _ = require('lodash');
const download = require('image-downloader');
const config = require('./config.json');
const fs = require('fs');
const folderPatch = process.cwd();
const cryptos = [];

const filesIconsExists = [];

const blacklist = [
  'emc 2',
  'c 2',
  'lc 4',
  'vec 2',
  'n 8 v',
  'xbtc 21',
  '2 give',
  'nlc 2',
  'erc 20',
  'b 2 b',
  'c 20',
  '1 wo',
  'j 8 t',
  'ac 3',
  'tm 2',
  '0 x btc',
  'rock 2',
  'x 8 x',
  'x 12',
  'f 1 c',
  'plus 1',
  'd 4 rk',
  'b 2 g',
  's 4 f',
  '1 sg',
  '1 x 2',
  'rc 20',
  'e 2 c',
  'p 2 px',
  'btc 2',
  'b 91',
  '7 e',
  'cix 100',
  'x 42',
  'mb 8',
  '1 up',
  '1 mt',
  '1 gold',
  'et lyte t',
  'on le xpa',
  '1 ai',
  'afro x',
  'ifx 24',
  'ak 12',
  'r 2 r',
  'im btc',
  'i own',
  'b 1 p',
  'ff 1',
  'ag 8',
  '2 key',
  'ly xe',
  'sac 1',
  't 69',
  'mo co',
  'btc 3 l',
  'btc 3 s',
  'eth 3 s',
  'eth 3 l',
  'gom 2',
  '3 cs',
  '4 art',
  'l 2 p',
  'ydai yusdc yusdt ytusd',
  'eth 20 smaco',
  'ethrsi 6040',
  's trx',
  's link',
  's btc',
  'fx 1',
  'lburst',
  'based',
  'e mtrg',
  'yamv 2',
  'dacc 2',
  'yi 12',
  'yf dai',
  'g kimchi',
  'i 9 c',
  'yfi 2',
  'p 2 p',
  'po sh',
  'y tsla',
  'x btc',
  'rope',
  'safe 2',
  'c 2 o',
  'yf 4',
  'defi s',
  'defi l',
  'milk 2',
  'wvg 0',
  'wg 0',
  'y ban',
  'pxusd mar 2021',
  'kp 3 r',
  'x dot',
  'n 0031',
  'kp 4 r',
  'yfb 2',
  '7 up',
  'nyan 2',
  'noob',
  'bst 1',
  'ib eth',
  'sav 3',
];

try {
  files = fs.readdirSync(`${folderPatch}/icons/`, { withFileTypes: true });
  files.forEach(function (result) {
    filesIconsExists.push(result.name.substr(0, result.name.length - 4));
  });
} catch (err) {
  cmlog.error(new Error(err));
}

cmlog.start('Start generator');
if (!_.isEmpty(config.apikey)) {
  axios
    .get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/map', {
      headers: { 'X-CMC_PRO_API_KEY': config.apikey },
    })
    .then((res) => {
      res.data.data.map((crypto, index) => {
        cryptos.push(_.lowerCase(crypto.symbol));
      });
    })

    .then(() => {
      cmlog.success(
        `Retrieving the list of cryptos Total: [${cryptos.length}]`
      );

      const cryptosData = _.filter(
        cryptos,
        (o) => !_.includes(filesIconsExists, o) && !_.includes(blacklist, o)
      );

      cryptosData.forEach((crypto, index) => {
        setTimeout(() => {
          axios
            .get(
              `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=${crypto}`,
              {
                headers: { 'X-CMC_PRO_API_KEY': config.apikey },
              }
            )
            .then((o) => {
              const imageUrl = o.data.data[_.upperCase(crypto)].logo;
              const options = {
                url: imageUrl,
                dest: `${folderPatch}/icons/${crypto}.png`,
              };

              download
                .image(options)
                .then(({ filename }) => {
                  cmlog.success(`Icon saved ${filename}`);
                  cmlog.waitting(`PROGRESS [${index + 1}/${cryptos.length}]`);
                })
                .catch((err) => cmlog.error(new Error(err)));
            })
            .catch((err) => cmlog.error(new Error(err)));
          if (index + 1 === cryptosData.length) {
            cmlog.done('All icons have been updated !');
          }
        }, 4000 * (index + 1));
      });
    })
    .catch((err) => {
      cmlog.error(new Error(err));
    });
} else {
  cmlog.error(new Error('No API key entered in config.json !'));
}
