


import express from 'express';
const crypto = require('crypto');
let router = express.Router();

router.get('/', (req, res) => {

    let info_obj = {};

    info_obj.name = 'theworldmarketplace';

    const hash = crypto.createHash('sha256');
    hash.update('theworldmarketplace');

    info_obj.hash = hash.digest('hex');
    info_obj.api_url = 'api.theworldmarketplace.com';
    info_obj.root_url = 'theworldmarketplace.com';

    res.status(200).json(info_obj)

});



export default router;