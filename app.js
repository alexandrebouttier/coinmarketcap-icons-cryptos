const axios = require('axios');

const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');

const cmlog = require('cmlog');
const _ = require('lodash');

const download = require('image-downloader');

const config = require('./config.json');

const folderPatch = process.cwd();
const cryptos = [];

const filesIconsExists = [];
const blacklist = [];

fs.createReadStream('blacklist.csv')
  .pipe(csv())
  .on('data', (data) => {
    blacklist.push(data.NAME);
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
      headers: { 'X-CMC_PRO_API_KEY': config.apikey }
    })
    .then((res) => {
      res.data.data.map((crypto, index) => {
        cryptos.push(_.lowerCase(crypto.symbol));
      });
    })
    .then(() => {
      const cryptosData = _.filter(
        cryptos,
        (o) => !_.includes(filesIconsExists, o) && !_.includes(blacklist, o)
      );

      cmlog.success(`Retrieving the list of cryptos Total: [${cryptosData.length}]`);

      if (cryptosData && cryptosData.length === 0) {
        cmlog.done('All icons have been updated !');
      } else {
        cryptosData.forEach((crypto, index) => {
          const cryptoName = crypto.replace(/\s+/g, '');

          setTimeout(() => {
            axios
              .get(
                `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=${cryptoName}`,
                {
                  headers: { 'X-CMC_PRO_API_KEY': config.apikey }
                }
              )
              .then((o) => {
                const imageUrl = o.data.data[_.upperCase(cryptoName)].logo;
                const options = {
                  url: imageUrl,
                  dest: `${folderPatch}/icons/${cryptoName}.png`
                };

                download
                  .image(options)
                  .then(({ filename }) => {
                    cmlog.success(`Icon saved ${filename}`);
                    cmlog.waitting(`PROGRESS [${index + 1}/${cryptosData.length}]`);
                  })
                  .catch((err) => cmlog.error(new Error(err)));
              })
              .catch((err) => {
                if (err && err.response && err.response.status === 400) {
                  cmlog.error(new Error(`Crypto icon not found => "${cryptoName}"`));

                  const csvWriter = createCsvWriter({
                    path: 'blacklist.csv',
                    header: [{ id: 'name', title: 'NAME' }],
                    append: true
                  });

                  const records = [{ name: cryptoName }];

                  csvWriter
                    .writeRecords(records) // returns a promise
                    .then(() => {
                      cmlog.info(`Crypto add blacklist => ${cryptoName}"`);
                    });
                }
              });

            if (index + 1 === cryptosData.length) {
              cmlog.done('All icons have been updated !');
            }
          }, 4000 * (index + 1));
        });
      }
    })
    .catch((err) => {
      cmlog.error(new Error(err));
    });
} else {
  cmlog.error(new Error('No API key entered in config.json !'));
}
