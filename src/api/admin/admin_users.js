import users from '../../../db/models/users';
import offers from '../../../db/models/offers';

import express from 'express';

const bodyParser = require('body-parser');
import multer from 'multer';

const crypto = require('crypto');

let router = express.Router();
router.use(bodyParser.json());

async function update_user(user) {
    return users.forge(user).save(null, {method: 'update'});
}

router.post('/approve', async (req, res) => {
    let {username} = req.body;

    console.log(username);
    users.where({username: username}).fetchAll()
        .then(async (user) => {
            console.log(user);
            if (user.length < 1) {
                res.status(200).json({status: `user not found ${username}`});
            } else {
                let the_user = user.models[0].attributes;
                if (the_user.admin_approved === false) {
                    try {
                        the_user.admin_approved = true;
                        await update_user(the_user);
                        res.status(200).json({staus: `updated to approved ${username} admin_approved field`});
                    } catch (err) {
                        console.error(err);
                        res.status(500).json({status: `error approving the user admin_approved status ${username}`});
                    }
                } else {
                    res.status(200).json({status: `${username} is already approved`});
                }
            }
        }).catch((err) => {
        console.log(err);
        res.status(500).json({error: `server side error trying to approve the user ${username}`});
    });
});

router.post('/reject', (req, res) => {
    let {username} = req.body;

    console.log(username);
    users.where({username: username}).fetchAll()
        .then(async (user) => {
            console.log(user);
            if (user.length < 1) {
                res.status(200).json({status: `user not found ${username}`});
            } else {
                let the_user = user.models[0].attributes;
                if (the_user.admin_approved === true) {

                    try {
                        the_user.admin_approved = false;
                        await update_user(the_user);
                        try {
                            offers.where({username: username}).fetchAll()
                                .then((the_offers) => {
                                    if (the_offers.length > 0) {
                                        for (const offer of the_offers.models) {
                                            offer.attributes.admin_approved = false;
                                            offer.save({
                                                method: 'update',
                                                patch: true
                                            });
                                        }
                                    } else {
                                        console.log(`nothing to clean for ${username}`);
                                    }
                                })
                        } catch(err) {
                            console.error(err);

                        }
                        res.status(200).json({staus: `updated to rejected ${username} admin_approved field`});
                    } catch (err) {
                        console.error(err);
                        res.status(500).json({status: `error rejecting the user admin_approved status ${username}`});
                    }
                } else {
                    res.status(200).json({status: `${username} is already rejected`});
                }
            }
        }).catch((err) => {
        console.log(err);
        res.status(500).json({error: `server side error trying to reject the user ${username}`});
    });
});

router.post('/get_all', (req, res) => {
    users.fetchAll()
        .then((the_users) => {
            if (the_users.length > 0) {
                let u_a = [];
                for (const user of the_users.models) {
                    u_a.push(user);
                }
                res.status(200).json({users: u_a});
            } else {
                res.status(500).json({error: `error on server side getting the users, length was 0`});
            }
        }).catch((err) => {
            res.status(500).json({error: `error fetching users some error on server`});
    });
});

router.post('/get_approved', (req, res) => {
    users.where({admin_approved: true}).fetchAll()
        .then((the_users) => {
            if (the_users.length > 0) {
                let u_a = [];
                for (const user of the_users.models) {
                    u_a.push(user);
                }
                res.status(200).json({users: u_a});
            } else {
                res.status(404).json({error: `it appears that there are no approved users`});
            }
        }).catch((err) => {
        res.status(500).json({error: `error fetching admin approved users some error on server`});
    });
});

router.post('/get_rejected', (req, res) => {
    users.where({admin_approved: false}).fetchAll()
        .then((the_users) => {
            if (the_users.length > 0) {
                let u_a = [];
                for (const user of the_users.models) {
                    u_a.push(user);
                }
                res.status(200).json({users: u_a});
            } else {
                res.status(500).json({error: `error on server side getting the admin rejected users, length was 0`});
            }
        }).catch((err) => {
        res.status(500).json({error: `error fetching admin rejected users some error on server`});
    });
});


export default router;




