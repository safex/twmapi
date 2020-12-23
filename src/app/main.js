import express from 'express';
import bodyParser from 'body-parser';
import {API_PORT} from '../../config.js';

import users from './users';
import info from './info';
import offers from './offers';
import messages from './messages';

var cors = require('cors');



var app = express();
app.use(cors());

app.use(bodyParser.json());

app.use('/users', users);
app.use('/info', info);
app.use('/offers', offers);
app.use('/messages', messages);


app.listen(API_PORT);




console.log(`TWM API service started on port: ${API_PORT}`);