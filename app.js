const axios = require('axios');
const cmlog = require('cmlog');
const _ = require('lodash');
const download = require('image-downloader');
const config = require('./config.json');

cmlog.start('Start generator');

const cryptos = [];
const filesErrors = [];

axios
  .get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/map', {
    headers: { 'X-CMC_PRO_API_KEY': config.apikey },
  })
  .then((res) => {
    res.data.data.map((crypto, index) =>
      cryptos.push(_.lowerCase(crypto.symbol))
    );
  })
  .then(() => {
    cmlog.success(`Récuperation de la liste des cryptos [${cryptos.length}]`);

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
              dest: `${config.folderDist}/${crypto}.png`,
            };

            download
              .image(options)
              .then(({ filename }) => {
                cmlog.success(`Image sauvegarder ${filename}`);
                cmlog.waitting(`PROGRESS [${index}/${cryptos.length}]`);
              })
              .catch((err) => cmlog.error(`1 Erreur image ${err}`));
          })
          .catch((err) => cmlog.error(`2 Erreur image ${err}`));
      }, 10000 * (index + 1));
    });
  })
  .catch((err) => {
    cmlog.error(new Error(err));
  });
