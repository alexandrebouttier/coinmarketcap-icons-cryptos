const axios = require('axios');
const cmlog = require('cmlog');
const _ = require('lodash');
const download = require('image-downloader');
const config = require('./config.json');
const fs = require('fs');
const folderPatch = process.cwd();
const cryptos = [];

const filesIconsExists = [];

try {
  files = fs.readdirSync(`${folderPatch}/icons/`, { withFileTypes: true });
  files.forEach(function (result) {
    filesIconsExists.push(result.name.substr(0, result.name.length - 4));
  });
} catch (err) {
  cmlog.error(new Error(err));
}
console.log('filesIconsExists', filesIconsExists);
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

      cryptos.forEach((crypto, index) => {
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
          if (index + 1 === cryptos.length) {
            cmlog.done('All icons have been updated !');
          }
        }, 10000 * (index + 1));
      });
    })
    .catch((err) => {
      cmlog.error(new Error(err));
    });
} else {
  cmlog.error(new Error('No API key entered in config.json !'));
}
