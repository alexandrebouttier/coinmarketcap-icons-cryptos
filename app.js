const axios = require('axios');
const csv = require('csv-parser');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'blacklist.csv',
});

const cmlog = require('cmlog');
const _ = require('lodash');
const download = require('image-downloader');
const config = require('./config.json');
const fs = require('fs');
var wstream = fs.createWriteStream('blacklist.csv');
const folderPatch = process.cwd();
const cryptos = [];

const filesIconsExists = [];

fs.createReadStream('blacklist.csv')
  .pipe(csv())
  .on('data', (row) => {
    console.log('lectutr', row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

const blacklist = [];

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
            .catch((err) => {
              if (err.response.status === 400) {
                console.log('filename', crypto);
                cmlog.error(new Error(`Crypto icon not found => "${crypto}"`));

                var wstream = fs.createWriteStream('blacklist.csv', {
                  flags: 'a',
                });
                wstream.write(`${crypto},`);
                wstream.end();

                /*   fs.writeFile(
                  'blacklist.csv',
                  crypto,

                  function (err) {
                    if (err) return console.log(err);
                    console.log('Hello World > helloworld.txt');
                  }
                ); */
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
