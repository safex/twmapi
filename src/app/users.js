import express from 'express';
import users from '../../db/models/users';
import sfxjs from 'safex_addressjs';
import keccak256 from 'keccak256';

async function update_user(user) {
    return users.forge(user).save(null, {method: 'update'});
}

let router = express.Router();

router.post('/range/:range', (req, res) => {


});


router.post('/name/:username', (req, res) => {
    try {
        let response = {};
        console.log(req.params.username);
        users.where({username: req.params.username}).fetchAll()
            .then(user => {
                console.log(user);
                if (user.length < 1) {
                    res.status(200).json({status: `not found`});
                } else {
                    let the_user = user.models[0].attributes;
                    if (the_user.admin_approved === true) {
                        response.username = the_user.username;
                        response.approved = the_user.approved_flag;
                        response.avatar_image = the_user.avatar_image;
                        response.twitter_url = the_user.twitter_url;
                        response.twm_formatted = the_user.twm_formatted;
                        response.pgp_public_key = the_user.pgp_public_key;
                        response.safex_public_key = the_user.safex_public_key;
                        res.status(200).json({user: response});
                    } else {
                        res.status(200).json({status: `user not found here`});
                    }
                }
                console.log(user);
            }).catch((err) => {
            console.log(err);
            res.status(500).json({error: `server side error`});
        });
    } catch (err) {
        console.error(err);
        console.error(`error on requesting: /users/name/${req.params.username}`);
        res.status(400).json({error: `error requesting: /users/name/${req.params.username}`});
    }
});

router.post('/get_all', (req, res) => {
    try {
        users.where({approved_flag: true}).fetchAll()
            .then(users => {
                let the_users = users.models;
                //here deconstruct the user and pack it into a
                //we need to cache the response here.


                res.status(200).json({users: the_users});
            })
            .catch(err => {
                console.error(err);
                res.status(200).json({status: `error at retrieving all users from api`});
            })

    } catch (err) {
        console.error(err);
        res.status(500).json({error: `error at getting all users from the api`});
    }
})


router.post('/register', async (req, res) => {
    try {


        let {username, pub_key, signature, message, msg_hash} = req.body;
        console.log(username);
        console.log(pub_key);
        console.log(signature);
        console.log(message);
        console.log(msg_hash);
        let response = {};

        users.where({username: username}).fetchAll()
            .then(async user => {
                if (user.length < 1) {
                    res.status(404).json({error: `${username} not found`});
                } else {

                    var t_user = user.models[0].attributes;

                    if (t_user.safex_public_key === pub_key) {
                        console.log(`safex and supplied pub keys match`);
                        if (t_user.registration_message !== '') {

                            let hash = keccak256(message).toString('hex');
                            if (hash === msg_hash) {
                                let sig_struct = {};
                                sig_struct.pub_key = pub_key;
                                sig_struct.msg_hash = msg_hash;
                                sig_struct.sig = signature;
                                let verified_msg = sfxjs.check_signature(signature);

                                console.log(verified_msg);
                                if (verified_msg === true) {
                                    console.log(verified_msg);

                                    try {
                                        let msg_obj = JSON.parse(message);
                                        console.log(t_user.registration_message);
                                        t_user.registration_message = message;
                                        console.log(t_user);
                                        t_user.pgp_public_key = msg_obj.rsa_pub_key;
                                        try {
                                            await update_user(t_user);
                                            res.status(200).json({status: `successfully registered ${username}`});
                                        } catch(err) {
                                            console.error(err);
                                            console.error(`error at saving the ${username} user see above for error`);
                                            res.status(400).json({error: `error at saving the ${username}`});
                                        }
                                    } catch(err) {
                                        console.error(err);
                                        console.error(`error with the parsing of the message to extrapolate the pgp key etc`);
                                        res.status(400).json({error: `error at the message extrapolation`});
                                    }

                                } else {
                                    console.error(`signature is not valid ${signature}`)
                                    res.status(404).json({error: `signature is not valid ${signature}`});
                                }
                            } else {
                                console.error(`hashes dont match ${hash} generated, ${msg_hash} supplied.`)
                                res.status(404).json({error: `error the message hash does not match the supplied message`});
                            }

                        } else {
                            console.log(`user already has a registration message`);
                            res.status(200).json({status: `user is already registered`});
                        }

                    } else {
                        console.error(`error that the pub_key supplied does not match the pub_key of the user on the blockchain`);
                        res.status(404).json({error: `the pub_key supplied and the pub_key of the user do not match`});
                    }


                }
            });

        //get username from database, get the pub key
        //get the signed_message and verify with the pub_key
        //receive username, signed message, and pgp key

    } catch (err) {
        console.error(err);
        console.error(`error on requesting: /users/name/${req.body.username}`);
        res.status(400).json({error: `error requesting: /users/name/${req.body.username}`});
    }
});

export default router;