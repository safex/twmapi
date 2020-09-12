import axios from 'axios';

import users from '../../db/models/users';
import offers from '../../db/models/offers';

import knex from 'knex';

async function get_height() {
    return axios({
        method: 'get',
        url: 'http://127.0.0.1:30393/get_info'
    }).then((resp) => {
        return resp.data.height;
    });
}

async function get_block(height) {
    let b_obj = {};
    b_obj.jsonrpc = "2.0";
    b_obj.id = 0;
    b_obj.method = "get_block";
    let h_obj = {};
    h_obj.height = height;
    b_obj.params = h_obj;
    return axios({
        method: 'post',
        url: 'http://127.0.0.1:30393/json_rpc',
        data: b_obj
    }).then((resp) => {
        return resp.data.result;
    })
}

async function get_transactions(obj) {
    return axios({
        method: 'post',
        url: 'http://127.0.0.1:30393/get_transactions',
        data: obj
    }).then((resp) => {
        return resp.data;
    })
}

async function get_user(obj) {
    return axios({
        method: 'post',
        url: 'http://127.0.0.1:30393/get_safex_account_info',
        data: obj
    }).then((resp) => {
        return resp.data;
    })
}

async function save_user(user) {
    return users.where({username: user.username}).count().then((count) => {
        if (count > 0) {
            console.log("we got more here");
        } else {
            console.log("time to save it");
            return users.forge(user).save(null, {method: 'insert'});
        }
    });
}

async function save_offer(offer) {
    return offers.where({offer_id: offer.offer_id}).count().then((count) => {
        if (count > 0) {
            console.log("we got more here");
        } else {
            console.log("time to save it");
            return offers.forge(offer).save(null, {method: 'insert'});
        }
    });
}
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
var last_block_scanned = 20000;
var users_arr = [];

async function main() {
    try {
        //get top block, then loop
        let top_block = await get_height();
        console.log(top_block);
        snooze(2000);
        for (last_block_scanned; last_block_scanned < top_block; last_block_scanned++) {
            try {

                let got_block = await get_block(last_block_scanned);

                if (got_block.block_header.num_txes > 0) {
                    console.log(`greater than 0 we have ${got_block.block_header.num_txes} transactions to sort through`);
                    try {
                        let t_obj = {};
                        t_obj.txs_hashes = got_block.tx_hashes;
                        t_obj.decode_as_json = true;
                        let txns = await get_transactions(t_obj);
                        for (const txn of txns.txs) {
                            let the_txn = JSON.parse(txn.as_json);
                            for (const vout of the_txn.vout) {
                                if (vout.target.script) {
                                    console.log(`ding ding ding`);

                                    switch(parseInt(vout.target.script.output_type)) {
                                        case 0: {
                                            console.log(`cash txn`);
                                            break;
                                        };
                                        case 1: {
                                            console.log(`token txn`);
                                            break;
                                        };
                                        case 2: {
                                            console.log(`migration txn`);
                                            break;
                                        };
                                        case 10: {
                                            console.log(`generic advanced txn`);
                                            break;
                                        };
                                        case 11: {
                                            console.log(`stake token txn`);
                                            break;
                                        };
                                        case 12: {
                                            console.log(`sfx payment to pool as part of purchase`);
                                            console.log(got_block.block_header);

                                            break;
                                        };
                                        case 15: {
                                            console.log(`account creation`);
                                            console.log(`create account transaction`);


                                            let user_indexes = [];
                                            let username_position = vout.target.script.data[0] + 1;
                                            for (var i = 1; i < username_position; i++) {
                                                if (vout.target.script.data[i] > 47 && vout.target.script.data[i] < 127) {
                                                    user_indexes.push(vout.target.script.data[i]);
                                                } else {
                                                    i = vout.target.script.data.length;
                                                }
                                            }


                                            console.log(user_indexes);
                                            let user_id = String.fromCharCode.apply(null, user_indexes);
                                            console.log(user_id);

                                            let u_obj = {};
                                            u_obj.username = user_id;

                                            console.log(u_obj);
                                            let userss = await get_user(u_obj);

                                            let pub_keys = '';
                                            for (const dec of vout.target.script.data.slice(username_position, username_position + 32)) {
                                                pub_keys += dec.toString(16);
                                            }

                                            let twm_formatted = false;
                                            let twitter_url = '';
                                            let facebook_url = '';
                                            let linkedin_url = '';
                                            let email_address = '';
                                            let avatar_image = '';
                                            let biography = '';
                                            let website = '';
                                            let location = '';
                                            let category = '';
                                            let twm_version = 0;
                                            console.log(String.fromCharCode.apply(null,
                                                vout.target.script.data.slice(username_position + 34, vout.target.script.data.length + 1)));
                                            try {
                                                let twm_description = JSON.parse(String.fromCharCode.apply(null,
                                                    vout.target.script.data.slice(username_position + 34, vout.target.script.data.length + 1)));

                                                if (twm_description.twm_version === 1) {
                                                    twm_formatted = true;
                                                    twm_version = 1;
                                                }
                                                if (twm_description.avatar) {
                                                    avatar_image = twm_description.avatar;
                                                }
                                                if (twm_description.twitter) {
                                                    twitter_url = twm_description.twitter;
                                                }
                                                if (twm_description.facebook) {
                                                    facebook_url = twm_description.facebook;
                                                }
                                                if (twm_description.linkedin) {
                                                    linkedin_url = twm_description.linkedin;
                                                }
                                                if (twm_description.email_address) {
                                                    email_address = twm_description.email_address;
                                                }
                                                if (twm_description.biography) {
                                                    biography = twm_description.biography;
                                                }
                                                if (twm_description.website) {
                                                    website = twm_description.website;
                                                }
                                                if (twm_description.location) {
                                                    location = twm_description.location;
                                                }
                                                if (twm_description.category) {
                                                    category = twm_description.category;
                                                }
                                            } catch(err) {
                                                console.error(err);
                                                console.error(`description is not parsable`);
                                            }
                                            try {
                                                let save_obj = {};

                                                save_obj.username = user_id;
                                                save_obj.avatar_image = avatar_image;
                                                save_obj.admin_approved = false;
                                                save_obj.twitter_url = twitter_url;
                                                save_obj.facebook_url = facebook_url;
                                                save_obj.linkedin_url = linkedin_url;
                                                save_obj.email_address = email_address;
                                                save_obj.biography = biography;
                                                save_obj.twm_formatted = twm_formatted;
                                                save_obj.raw_description = String.fromCharCode.apply(null, vout.target.script.data.slice(username_position + 34, vout.target.script.data.length + 1));
                                                save_obj.block_height = got_block.block_header.height;
                                                save_obj.pgp_public_key = '';
                                                save_obj.pgp_fingerprint = '';
                                                save_obj.website = website;
                                                save_obj.location = location;
                                                save_obj.safex_public_key = pub_keys;
                                                save_obj.twm_version = twm_version;
                                                save_obj.category = category;

                                                let the_save = await save_user(save_obj);
                                                console.log(the_save);

                                                break;
                                            } catch(err) {
                                                console.error(err);
                                                console.error(`error at saving the user object at account creation output`);
                                                process.exit();
                                                break;
                                            }
                                            break;

                                        };
                                        case 16: {
                                            console.log(`account update txn`);
                                            break;
                                        };
                                        case 20: {
                                            console.log(`safex offer txn`);
                                            console.log(vout.target.script);
                                            console.log(last_block_scanned);
                                            let offer_id = '';
                                            for (const dec of vout.target.script.data.slice(0, 32)) {
                                                offer_id += dec.toString(16);
                                            }
                                            console.log(`offer id ${offer_id}`);
                                            let username_length = vout.target.script.data[64];
                                            let offer_title_length = vout.target.script.data[username_length + 65];
                                            let offer_title_start = username_length + 65;
                                            let offer_title = vout.target.script.data.slice(offer_title_start, offer_title_start + offer_title_length + 1);
                                            let price = vout.target.script.data.slice(offer_title_start + offer_title_length + 1, offer_title_start + offer_title_length + 9);
                                            price.reverse();
                                            var price_to_number = price.reduce((a,c,i)=> a+c*2**(56-i*8),0) / 10000000000;
                                            console.log(price_to_number);

                                            let min_price = vout.target.script.data.slice(offer_title_start + offer_title_length + 9, offer_title_start + offer_title_length + 17);
                                            min_price.reverse();
                                            var min_price_to_number = min_price.reduce((a,c,i)=> a+c*2**(56-i*8),0) / 10000000000;
                                            console.log(`min sfx price ${min_price_to_number}`);
                                            let quantity = vout.target.script.data.slice(offer_title_start + offer_title_length + 17, offer_title_start + offer_title_length + 25);
                                            quantity.reverse();
                                            var quantity_to_number = quantity.reduce((a,c,i)=> a+c*2**(56-i*8),0);
                                            console.log(`quantity_to_number  ${quantity_to_number}`);
                                            let active_bool = vout.target.script.data[offer_title_start + offer_title_length + 25];
                                            console.log(`active bool ${active_bool}`);
                                            let oracle_bool = vout.target.script.data[offer_title_start + offer_title_length + 26];
                                            console.log(`oracle_bool ${oracle_bool}`);
                                            let description_length = vout.target.script.data[offer_title_start + offer_title_length + 27];
                                            console.log(`description_length ${description_length}`);
                                            let description_raw = vout.target.script.data.slice(offer_title_start + offer_title_length + 28, offer_title_start + offer_title_length + 28 + description_length);
                                            console.log(String.fromCharCode.apply(null, description_raw));
                                            //process.exit();

                                            let username_slice = vout.target.script.data.slice(65, 65 + vout.target.script.data[64]);
                                            console.log(`username length ${vout.target.script.data[64]}`);
                                            console.log(`username ${String.fromCharCode.apply(null, username_slice)}`);
                                            console.log(`offer title ${String.fromCharCode.apply(null,offer_title)}`);
                                            console.log(`\n`);
                                            console.log(parseInt(232).toString(16));
                                            console.log(String.fromCharCode.apply(null, vout.target.script.data));
                                            let twm_formatted = false;
                                            let description = '';
                                            let main_image = '';
                                            let sku = '';
                                            let barcode = '';
                                            let weight = '';
                                            let country = '';
                                            let message_type = '';
                                            let physical = true;
                                            let twm_version = 0;
                                            try {

                                                let twm_description = JSON.parse(String.fromCharCode.apply(null, description_raw));

                                                if (twm_description.twm_version === 1) {
                                                    twm_formatted = true;
                                                    twm_version = 1;
                                                }
                                                if (twm_description.description) {
                                                    description = twm_description.description;
                                                }
                                                if (twm_description.main_image) {
                                                    main_image = twm_description.main_image;
                                                }
                                                if (twm_description.sku) {
                                                    sku = twm_description.sku;
                                                }
                                                if (twm_description.barcode) {
                                                    barcode = twm_description.barcode;
                                                }
                                                if (twm_description.weight) {
                                                    weight = twm_description.weight;
                                                }
                                                if (twm_description.country) {
                                                    country = twm_description.country;
                                                }
                                                if (twm_description.message_type) {
                                                    message_type = twm_description.message_type;
                                                }
                                                if (twm_description.physical) {
                                                    physical = twm_description.physical;
                                                }
                                            } catch(err) {
                                                console.error(err);
                                                console.error(`offer description is not parsable`);
                                            }
                                            try {
                                                let save_obj = {};
                                                save_obj.offer_id = offer_id;
                                                save_obj.username = String.fromCharCode.apply(null, username_slice);
                                                save_obj.main_image = main_image;
                                                save_obj.admin_approved = false;
                                                save_obj.sku = sku;
                                                save_obj.barcode = barcode;
                                                save_obj.weight = weight;
                                                save_obj.country = country;
                                                save_obj.message_type = message_type;
                                                save_obj.twm_formatted = twm_formatted;
                                                save_obj.raw_description = description_raw;
                                                save_obj.block_height = got_block.block_header.height;
                                                save_obj.physical = physical;
                                                save_obj.twm_version = twm_version;
                                                save_obj.min_price = min_price_to_number;
                                                save_obj.price = price_to_number;
                                                save_obj.oracle = oracle_bool ? true : false;
                                                save_obj.oracle_id = oracle_bool ? '' : '';
                                                save_obj.quantity = quantity_to_number;
                                                save_obj.description = description;

                                                let the_save = await save_offer(save_obj);
                                                console.log(the_save);

                                                break;
                                            } catch(err) {
                                                console.error(err);
                                                console.error(`error at saving the offer object at offer creation output`);
                                                process.exit();
                                                break;
                                            }
                                        };
                                        case 21: {
                                            console.log(`edit offer txn`);
                                            break;
                                        };
                                        case 30: {
                                            console.log(`purchase offer txn`);
                                            console.log(vout.target.script);
                                            console.log(last_block_scanned);
                                            process.exit();
                                            break;
                                        };
                                        case 40: {
                                            console.log(`feedback token`);
                                            break;
                                        };
                                        case 41: {
                                            console.log(`feedback txn`);
                                            break;
                                        };
                                        case 50: {
                                            console.log(`new price oracle txn`);
                                            break;
                                        };
                                        case 51: {
                                            console.log(`price oracle update txn`);
                                            break;
                                        };
                                    }

                                } else {
                                }
                            }
                        }
                    } catch (err) {
                        console.error(err);
                        console.error(`error at the get_transactions function`);
                    }
                } else {

                }
            } catch (err) {
                console.error(err);
                console.error(`error at getting block ${last_block_scanned}`)

            }
        }

        //end of the scan loop here


    } catch (err) {
        console.error(err);
        console.error(`error at getting the block height`);
    }
}

main();