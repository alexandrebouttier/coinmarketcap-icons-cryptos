const axios = require('axios');
const csv = require('csv-parser');

const cmlog = require('cmlog');
const _ = require('lodash');
const download = require('image-downloader');
const config = require('./config.json');
const fs = require('fs');

const folderPatch = process.cwd();
const cryptos = [];

const filesIconsExists = [];
const blacklist = [];

fs.createReadStream('blacklist.csv')
  .pipe(csv())
  .on('data', (data) => blacklist.push(data))
  .on('end', () => {
    console.log(blacklist);
  });

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
      console.log('blacklist === ', blacklist);
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
            .catch((err) => {
              if (err.response.status === 400) {
                cmlog.error(new Error(`Crypto icon not found => "${crypto}"`));
                /*   var wstream = fs.createWriteStream('blacklist.csv', {
                  flags: 'a',
                });
                wstream.write(`${crypto}` + ',');
                wstream.end(); */

                const createCsvWriter = require('csv-writer')
                  .createObjectCsvWriter;
                const csvWriter = createCsvWriter({
                  path: 'blacklist.csv',
                  header: [{ id: 'name', title: 'NAME' }],
                  append: true,
                });

                const records = [{ name: crypto }];

                csvWriter
                  .writeRecords(records) // returns a promise
                  .then(() => {
                    cmlog.info(`Crypto add blacklist => ${crypto}"`);
                  });
              }
            });
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
