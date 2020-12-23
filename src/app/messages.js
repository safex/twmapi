import express from 'express';
import offers from '../../db/models/offers';
import users from '../../db/models/users';
import messages from '../../db/models/messages';

let router = express.Router();




router.post('/get_seller/:username', (req, res) => {
    try {

        let {username} = req.params;
        users.where({username: req.params.username, admin_approved: true}).fetchAll()
            .then((user) => {
                if (user.length > 0) {
                    let res_obj = {};
                    res_obj.pgp_key = user.models[0].attributes.pgp_public_key;
                    res_obj.username = user.models[0].attributes.username;
                    res.status(200).json({user: res_obj});
                } else {
                    res.status(404).json({error: `${username} not found`});
                }
            })
    } catch(err) {
        console.error(err);
        console.error(`error at requesting the /set_seller/:username method messages`);
        res.status(400).json({error: `error at the request perhaps missing username field`});
    }
});

router.post('/send_message', (req, res) => {
    let {username} = req.params;
    users.where({username: req.params.username, admin_approved: true}).fetchAll()
        .then((user) => {
            if (user.length > 0) {

            } else {
                res.status(404).json({error: `${username} not found`});
            }
        })
});

router.post('/get_messages', (req, res) => {
    let {username} = req.params;
    //retrieve messages by username and by signed public key
    users.where({username: req.params.username, admin_approved: true}).fetchAll()
        .then((user) => {
            if (user.length > 0) {

            } else {
                res.status(404).json({error: `${username} not found`});
            }
        })
});


router.post('/get_messages_signature', (req, res) => {
    let {signature} = req.params;
    users.where({username: req.params.username, admin_approved: true}).fetchAll()
        .then((user) => {
            if (user.length > 0) {

            } else {
                res.status(404).json({error: `${username} not found`});
            }
        })
});

async function save_message(message) {
    return messages.where({msg_id: message.msg_id}).count().then((count) => {
        if (count > 0) {
            console.log("we got an overlapping message here, duplicate");
        } else {
            console.log("time to save it");
            return messages.forge(message).save(null, {method: 'insert'});
        }
    });
}

async function message_count(message) {
    return messages.where({msg_id: message.msg_id}).count((count) => {
        return count;
    });
}

router.post('/send_purchase_message', async (req, res) => {
    let {signature} = req.params;
    let {message_header} = req.params;

    if (message_header) {
        messages.where({purchase_proof: message_header.purchase_proof}).count(async (count) => {
            if (count > 0) {
                res.status(404).error({error: `error you already used this proof`});
            } else {
                users.where({username: message_header.to}).fetchAll(async (user) => {
                    if (user.length > 0) {
                        let user_atts = user.models[0].attributes;
                        if (user_atts.admin_approved === false) {
                            res.status(404).json({error: `error the user ${message_header.to} is not found`});
                        } else {
                            try {
                                let count = await message_count(message_header);
                                console.log(count);
                                let msg_id = message_header.order_id + count.toString();

                                let msg_save_obj = {};
                                msg_save_obj.msg_id = msg_id;
                                msg_save_obj.to = message_header.to;
                                msg_save_obj.from = message_header.from;
                                msg_save_obj.purchase_proof = message_header.purchase_proof;
                                msg_save_obj.sender_pgp_pub_key = message_header.sender_pgp_pub_key;
                                msg_save_obj.message_hash = message_header.message_hash;


                            } catch(err) {
                                console.error(err);
                            }
                        }
                    }
                })
            }
        }).catch((err) => {
            console.error(err);
            res.status(500).json({error: `error at retrieving the first step in receiving a message for purchase`});
        })

    } else {
        res.status(400).json({error: `error at sending a message_header`});
    }
});

router.post('/merchant_get_messages', (req, res) => {
    let {signature} = req.params;
    users.where({username: req.params.username, admin_approved: true}).fetchAll()
        .then((user) => {
            if (user.length > 0) {

            } else {
                res.status(404).json({error: `${username} not found`});
            }
        })
});

export default router;