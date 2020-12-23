import express from 'express';
import bodyParser from 'body-parser';
import {ADMIN_API_PORT} from '../../../config.js';

import admin_offers from './admin_offers';
import admin_users from './admin_users';

var cors = require('cors');



var app = express();
app.use(cors());

app.use(bodyParser.json());

app.use('/admin/offers', admin_offers);
app.use('/admin/users', admin_users);

app.listen(ADMIN_API_PORT);

console.log(`TWM API admin service started on port: ${ADMIN_API_PORT}`);