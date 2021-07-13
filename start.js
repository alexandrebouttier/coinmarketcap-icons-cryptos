const axios = require('axios');

const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');

const cmlog = require('cmlog');
const _ = require('lodash');

const download = require('image-downloader');

const config = require('./config.json');
const package = require('./package.json');

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

cmlog.start(`coinmarketcap-icons-cryptos V${package.version} => Start generator`);

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
        (o) =>
          !_.includes(filesIconsExists, o.replace(/\s+/g, '')) &&
          !_.includes(blacklist, o.replace(/\s+/g, ''))
      );

      cmlog.success(`Retrieving the list of cryptos Total: [${cryptosData.length}]`);

      if (cryptosData && cryptosData.length === 0) {
        cmlog.done('All icons have been updated !');
      } else {
        cryptosData.forEach((crypto, index) => {
          let cryptoName = crypto;

          if (cryptoName.indexOf(' ') >= 0) {
            cryptoName = crypto.replace(/\s+/g, '');
          }

          setTimeout(() => {
            axios
              .get(
                `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=${cryptoName}`,
                {
                  headers: { 'X-CMC_PRO_API_KEY': config.apikey }
                }
              )
              .then((o) => {
                const imageUrl = _.values(o.data.data)[0].logo;
                const options = {
                  url: imageUrl,
                  dest: `${folderPatch}/icons/${cryptoName}.png`
                };

                download
                  .image(options)
                  .then(({ filename }) => {
                    cmlog.success(`Icon saved ${cryptoName} => ${filename}`);
                    cmlog.waitting(`PROGRESS [${index + 1}/${cryptosData.length}]`);
                  })
                  .catch((err) => cmlog.error(new Error(err)));
              })
              .catch((err) => {
                cmlog.error(new Error(`Error => "${cryptoName} ${err}"`));

                //&& err.response && err.response.status === 400
                if (err) {
                  cmlog.error(new Error(`Crypto icon not found => "${cryptoName}"`));

                  const csvWriter = createCsvWriter({
                    path: 'blacklist.csv',
                    header: [{ id: 'name', title: 'NAME' }],
                    append: true
                  });

                  const records = [{ name: cryptoName }];

                  csvWriter
                    .writeRecords(records)
                    .then(() => {
                      cmlog.info(`Crypto add blacklist => ${cryptoName}"`);
                    })
                    .catch((err) => {
                      cmlog.error(new Error(`Error write icon in blacklist => "${cryptoName}"`));
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
