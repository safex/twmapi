import offers from '../../../db/models/offers';
import users from '../../../db/models/users';

import express from 'express';

const bodyParser = require('body-parser');
import multer from 'multer';

const crypto = require('crypto');

let router = express.Router();
router.use(bodyParser.json());

async function update_offer(offer) {
    return offers.forge(offer).save(null, {method: 'update'});
}

router.post('/approve', async (req, res) => {
    let {offer_id} = req.body;

    console.log(offer_id);
    offers.where({offer_id: offer_id}).fetchAll()
        .then(async (offer) => {
            console.log(offer);
            if (offer.length < 1) {
                res.status(404).json({status: `offer not found ${offer_id}`});
            } else {

                users.where({username: offer.models[0].attributes.username, admin_approved: true}).fetchAll()
                    .then(async user => {
                    if (user.length > 0) {
                        let the_offer = offer.models[0].attributes;
                        if (the_offer.admin_approved === false) {

                            try {
                                the_offer.admin_approved = true;
                                await update_offer(the_offer);
                                res.status(200).json({staus: `updated to approved ${offer_id} admin_approved field`});
                            } catch (err) {
                                console.error(err);
                                res.status(500).json({status: `error approving the offer admin_approved status ${offer_id}`});
                            }
                        } else {
                            res.status(200).json({status: `${offer_id} offer is already approved`});
                        }
                    } else {
                        console.log(`user is not approved ${offer.models[0].attributes.username}`);
                        res.status(200).json({status: `user is not approved ${offer.models[0].attributes.username}`})
                    }
                }).catch(err => {
                    res.status(500).json({status: `error at fetching the user eligibility status`});
                });
            }
        }).catch((err) => {
        console.log(err);
        res.status(500).json({error: `server side error trying to approve offer ${offer_id}`});
    });
});

router.post('/reject', (req, res) => {
    let {offer_id} = req.body;

    console.log(offer_id);
    offers.where({offer_id: offer_id}).fetchAll()
        .then(async (offer) => {
            console.log(offer);
            if (offer.length < 1) {
                res.status(404).json({status: `offer not found ${offer_id}`});
            } else {
                let the_offer = offer.models[0].attributes;
                if (the_offer.admin_approved === true) {

                    try {
                        the_offer.admin_approved = false;
                        await update_offer(the_offer);
                        res.status(200).json({staus: `updated to rejected ${offer_id} admin_approved field`});
                    } catch (err) {
                        console.error(err);
                        res.status(500).json({status: `error rejecting the offer admin_approved status ${offer_id}`});
                    }
                } else {
                    res.status(200).json({status: `${offer_id} offer is already rejected`});
                }
            }
        }).catch((err) => {
        console.log(err);
        res.status(500).json({error: `server side error trying to reject the offer ${offer_id}`});
    });
});

router.post('/approve/user/:username', (req, res) => {
    let {username} = req.params;

    console.log(`/approve/user/${username}`);
    users.where({username: username, admin_approved: true}).fetchAll()
        .then((user) => {
            if (user.length > 0) {
                offers.where({username: username, admin_approved: false}).fetchAll()
                    .then((the_offers) => {
                        let of_obj = {};
                        of_obj.status = `approved and updated`;
                        of_obj.offers = [];
                        if (the_offers.length > 0) {
                            for (const offer of the_offers.models) {
                                offer.admin_approved = true;
                                offer.save();
                                of_obj.offers.push(offer.offer_id);
                            }

                            res.staus(200).json(of_obj);
                        }
                    }).catch((err) => {
                    console.error(err);
                    console.error(`error at the fetch of the offers for user ${username}`);
                    res.status(500).json({error: `error at the /approve/user/${username} fetching offers`});
                })
            }
        }).catch((err) => {
        console.error(err);
        console.error(`error at the fetch of the user ${username}`);
        res.status(500).json({error: `error at the /approve/user/${username} fetching the user`});
    })
})

router.post('/get_all', (req, res) => {
    offers.fetchAll()
        .then((the_offers) => {
            if (the_offers.length > 0) {
                let o_a = [];
                for (const offer of the_offers.models) {
                    o_a.push(offer);
                }
                res.status(200).json({offers: o_a});
            } else {
                res.status(404).json({error: `error on server side getting the users, length was 0`});
            }
        }).catch((err) => {
        res.status(500).json({error: `error fetching users some error on server`});
    });
});

router.post('/get_all/:username', (req, res) => {
    offers.where({username: req.params.username}).fetchAll()
        .then((the_offers) => {
            if (the_offers.length > 0) {
                let o_a = [];
                for (const offer of the_offers.models) {
                    o_a.push(offer);
                }
                res.status(200).json({offers: o_a});
            } else {
                res.status(404).json({error: `error on server side getting the users, length was 0`});
            }
        }).catch((err) => {
        res.status(500).json({error: `error fetching users some error on server`});
    });
});

router.post('/get_approved', (req, res) => {
    offers.where({admin_approved: true}).fetchAll()
        .then((the_offers) => {
            if (the_offers.length > 0) {
                let o_a = [];
                for (const offer of the_offers.models) {
                    o_a.push(offer);
                }
                res.status(200).json({offers: o_a});
            } else {
                res.status(404).json({error: `it appears that there are no approved offers`});
            }
        }).catch((err) => {
        res.status(500).json({error: `error fetching admin approved offers some error on server`});
    });
});

router.post('/get_approved/:username', (req, res) => {
    offers.where({admin_approved: true, username: req.params.username}).fetchAll()
        .then((the_offers) => {
            if (the_offers.length > 0) {
                let o_a = [];
                for (const offer of the_offers.models) {
                    o_a.push(offer);
                }
                res.status(200).json({offers: o_a});
            } else {
                res.status(404).json({error: `it appears that there are no approved offers`});
            }
        }).catch((err) => {
        res.status(500).json({error: `error fetching admin approved offers some error on server`});
    });
});

router.post('/get_rejected', (req, res) => {
    offers.where({admin_approved: false}).fetchAll()
        .then((the_offers) => {
            if (the_offers.length > 0) {
                let o_a = [];
                for (const offer of the_offers.models) {
                    o_a.push(offer);
                }
                res.status(200).json({offers: o_a});
            } else {
                res.status(404).json({error: `error on server side getting the admin rejected offers, length was 0`});
            }
        }).catch((err) => {
        res.status(500).json({error: `error fetching admin rejected offers some error on server`});
    });
});

router.post('/get_rejected/:username', (req, res) => {
    offers.where({admin_approved: false, username: req.params.username}).fetchAll()
        .then((the_offers) => {
            if (the_offers.length > 0) {
                let o_a = [];
                for (const offer of the_offers.models) {
                    o_a.push(offer);
                }
                res.status(200).json({offers: o_a});
            } else {
                res.status(404).json({error: `error on server side getting the admin rejected offers, length was 0`});
            }
        }).catch((err) => {
        res.status(500).json({error: `error fetching admin rejected offers some error on server`});
    });
});


export default router;




