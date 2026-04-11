const express = require('express');
const _ = require('lodash');
const moment = require('moment');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
  const message = `Hello World! Current time: ${currentTime}`;
  const upperMessage = _.toUpper(message);
  
  res.send(upperMessage);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});