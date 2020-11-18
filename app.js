const axios = require('axios');
const cmlog = require('cmlog');
const _ = require('lodash');

const config = require('./config.json');

cmlog.debug('Start generator');

const cryptos = [];
const data = [];

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
    cmlog.success('Récuperation de la liste des cryptos');

    cryptos.forEach(function (crypto, index) {
      setTimeout(function () {
        console.log('get logo url');
        axios
          .get(
            `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=${crypto}`,
            {
              headers: { 'X-CMC_PRO_API_KEY': config.apikey },
            }
          )
          .then((o) =>
            console.log('youp', o.data.data[_.upperCase(crypto)].logo)
          )
          .catch((err) => console.log('errreur', err));
      }, 10000 * (index + 1)); // or just index, depends on your needs
    });
  })
  .catch((err) => {
    cmlog.error(new Error(err));
  });
