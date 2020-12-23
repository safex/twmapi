import express from 'express';
import offers from '../../db/models/offers';
import users from '../../db/models/users';

let router = express.Router();

router.post('/range/:range', (req, res) => {


});


router.post('/offer/:id', (req, res) => {
    try {
        let response = {};
        console.log(req.params.id);
        offers.where({offer_id: req.params.id, edit_admin_reapprove: false, admin_approved: true}).fetchAll()
            .then(offer => {
                console.log(offer);
                if (offer.length < 1) {
                    res.status(404).json({status: `offer ${req.params.id} not found`});
                } else {
                    let the_offer = offer.models[0].attributes;
                    if (the_offer.admin_approved === true) {
                        response.username = the_offer.username;
                        response.offer_id = the_offer.offer_id;
                        response.main_image = the_offer.main_image;
                        response.description = the_offer.description;
                        response.twm_formatted = the_offer.twm_formatted;
                        response.pgp_public_key = the_offer.pgp_public_key;
                        response.safex_public_key = the_offer.safex_public_key;
                        response.twm_version = the_offer.twm_version;
                        response.messaging_policy = the_offer.messaging_policy;
                        response.country = the_offer.country;
                        response.weight = the_offer.weight;
                        response.barcode = the_offer.barcode;
                        response.sku = the_offer.sku;
                        response.title = the_offer.title;
                        response.physical = the_offer.physical;
                        response.open_message = the_offer.open_message;
                        response.shipping = the_offer.shipping;
                        response.nft = the_offer.nft;
                        response.price = the_offer.price;
                        response.min_price = the_offer.min_price;
                        response.quantity = the_offer.quantity;
                        response.message_type = the_offer.message_type;
                        response.active = the_offer.active;
                        res.status(200).json({offer: response});
                    } else {
                        res.status(404).json({status: `offer not found here`});
                    }
                }
                console.log(user);
            }).catch((err) => {
            console.log(err);
            res.status(500).json({error: `server side error`});
        });
    } catch (err) {
        console.error(err);
        console.error(`error on requesting: /offer/id/${req.params.username}`);
        res.status(500).json({error: `error requesting: /offer/id/${req.params.username}`});
    }
});

router.post('/get_all', (req, res) => {
    try {
        offers.where({admin_approved: true, edit_admin_reapprove: false}).fetchAll()
            .then(offers => {
                let the_offers = offers.models;
                let offer_a = [];
                for (const off of the_offers) {
                    let offer = off.attributes;
                    console.log(`sorting`);
                    console.log(offer);
                    let o_obj = {};
                    o_obj.username = offer.username;
                    o_obj.offer_id = offer.offer_id;
                    o_obj.main_image = offer.main_image;
                    o_obj.description = offer.description;
                    o_obj.twm_formatted = offer.twm_formatted;
                    o_obj.pgp_public_key = offer.pgp_public_key;
                    o_obj.safex_public_key = offer.safex_public_key;
                    o_obj.twm_version = offer.twm_version;
                    o_obj.messaging_policy = offer.messaging_policy;
                    o_obj.country = offer.country;
                    o_obj.weight = offer.weight;
                    o_obj.barcode = offer.barcode;
                    o_obj.sku = offer.sku;
                    o_obj.title = offer.title;
                    o_obj.physical = offer.physical;
                    o_obj.open_message = offer.open_message;
                    o_obj.shipping = offer.shipping;
                    o_obj.nft = offer.nft;
                    o_obj.price = offer.price;
                    o_obj.min_price = offer.min_price;
                    o_obj.quantity = offer.quantity;
                    o_obj.message_type = offer.message_type;
                    o_obj.active = offer.active;
                    offer_a.push(o_obj);
                    console.log(`added`);
                }
                console.log(offer_a);

                console.log(`responding`);
                res.status(200).json({offers: offer_a});
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({status: `error at retrieving all offers from api`});
            })

    } catch (err) {
        console.error(err);
        res.status(500).json({error: `error at getting all offers from the api`});
    }
});

router.post('/get_all_active', (req, res) => {
    try {
        offers.where({admin_approved: true, active: true, edit_admin_reapprove: false}).fetchAll()
            .then(offers => {
                let the_offers = offers.models;
                let offer_a = [];
                for (const off of the_offers) {
                    let offer = off.attributes;
                    let o_obj = {};
                    o_obj.username = offer.username;
                    o_obj.offer_id = offer.offer_id;
                    o_obj.main_image = offer.main_image;
                    o_obj.description = offer.description;
                    o_obj.twm_formatted = offer.twm_formatted;
                    o_obj.pgp_public_key = offer.pgp_public_key;
                    o_obj.safex_public_key = offer.safex_public_key;
                    o_obj.twm_version = offer.twm_version;
                    o_obj.messaging_policy = offer.messaging_policy;
                    o_obj.country = offer.country;
                    o_obj.weight = offer.weight;
                    o_obj.barcode = offer.barcode;
                    o_obj.sku = offer.sku;
                    o_obj.title = offer.title;
                    o_obj.physical = offer.physical;
                    o_obj.open_message = offer.open_message;
                    o_obj.shipping = offer.shipping;
                    o_obj.nft = offer.nft;
                    o_obj.price = offer.price;
                    o_obj.min_price = offer.min_price;
                    o_obj.quantity = offer.quantity;
                    o_obj.message_type = offer.message_type;
                    o_obj.active = offer.active;
                    offer_a.push(o_obj);
                }
                res.status(200).json({offers: offer_a});
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({status: `error at retrieving all active offers from api`});
            })

    } catch (err) {
        console.error(err);
        res.status(500).json({error: `error at getting all active offers from the api`});
    }
});

router.post('/offer/:username', (req, res) => {
    users.where({username: req.body.username, admin_approved: true}).fetchAll()
        .then((user) => {
            if (user.length === 1) {
                offers.where({username: req.body.username, admin_approved: true, edit_admin_reapprove: false}).fetchAll()
                    .then((the_offers) => {
                        let o_obj = {};
                        o_obj.offers = [];
                        for (const offer of the_offers) {
                            let off = offer.models[0].attributes;
                            let io_obj = {};
                            io_obj.username = off.username;
                            io_obj.offer_id = off.offer_id;
                            io_obj.main_image = off.main_image;
                            io_obj.description = off.description;
                            io_obj.twm_formatted = off.twm_formatted;
                            io_obj.pgp_public_key = off.pgp_public_key;
                            io_obj.safex_public_key = off.safex_public_key;
                            io_obj.twm_version = off.twm_version;
                            io_obj.messaging_policy = off.messaging_policy;
                            io_obj.country = off.country;
                            io_obj.weight = off.weight;
                            io_obj.barcode = off.barcode;
                            io_obj.sku = off.sku;
                            io_obj.title = off.title;
                            o_obj.physical = off.physical;
                            o_obj.open_message = off.open_message;
                            o_obj.shipping = off.shipping;
                            o_obj.nft = off.nft;
                            io_obj.price = off.price;
                            io_obj.min_price = off.min_price;
                            io_obj.quantity = off.quantity;
                            io_obj.active = off.active;
                            io_obj.message_type = off.message_type;
                            o_obj.offers.push(io_obj);
                        }
                        res.status(200).json({offers: o_obj});
                    }).catch((err) => {
                    console.error(err);
                    console.error(`error at retrieving the offers by user`);
                    res.status(500).json({error: `error at getting the offers`});
                })
            }
        }).catch((err) => {
        console.error(err);
        console.error(`error at retrieving the user`);
        res.status(500).json({error: `error at retrieving by the username`});
    });
});

export default router;