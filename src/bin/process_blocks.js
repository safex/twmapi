import axios from 'axios';

import users from '../../db/models/users';
import offers from '../../db/models/offers';
import offer_edits from '../../db/models/offer_edits';

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
            console.log("we got more users here, duplicate");
        } else {
            console.log("time to save it");
            return users.forge(user).save(null, {method: 'insert'});
        }
    });
}

async function save_offer(offer) {
    return offers.where({offer_id: offer.offer_id}).count().then((count) => {
        if (count > 0) {
            console.log("we got more offers here, duplicate");
        } else {
            console.log("time to save it");
            return offers.forge(offer).save(null, {method: 'insert'});
        }
    });
}

async function save_offer_edit_txn(edit) {
    return offer_edits.where({edit_txid: edit.edit_txid}).count().then((count) => {
        if (count > 0) {
            console.log("we got more edit offers of the same kind here, duplicate");
        } else {
            console.log("time to save it an edit offer");
            return offer_edits.forge(edit).save(null, {method: 'insert'});
        }
    });
}

async function get_offer_by_offer_id(offer_id) {
    return offers.where({offer_id: offer_id}).fetchAll().then((offer) => {
        if (offer.length === 1) {
            return offer;
        } else {
            return 0;
        }
    });
}

async function save_edit_offer(offer_id, edit_obj) {
    return offers.where({offer_id: offer_id}).save(edit_obj, { patch: true }).then((offer) => {
        return offer;
    })
}

async function get_offer_version_counts(offer_id) {
    return offer_edits.where({offer_id: offer_id}).count().then((offer_count) => {
        return offer_count;
    })
}


async function daemon_parse_transaction(data, output_type) {
    let d_obj = {};
    d_obj.jsonrpc = "2.0";
    d_obj.id = 0;
    d_obj.method = "decode_safex_output";
    let h_obj = {};
    h_obj.output_type = output_type;
    h_obj.data = data;
    d_obj.params = h_obj;
    return axios({
        method: 'post',
        url: 'http://127.0.0.1:30393/json_rpc',
        data: d_obj
    }).then((resp) => {
        return resp.data.result;
    })
}


const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
var last_block_scanned = 50000;
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

                                    switch (parseInt(vout.target.script.output_type)) {
                                        case 0: {
                                            console.log(`cash txn`);
                                            break;
                                        }
                                        case 1: {
                                            console.log(`token txn`);
                                            break;
                                        }
                                        case 2: {
                                            console.log(`migration txn`);
                                            break;
                                        }
                                        case 10: {
                                            console.log(`generic advanced txn`);
                                            break;
                                        }
                                        case 11: {
                                            console.log(`stake token txn`);
                                            break;
                                        }
                                        case 12: {
                                            console.log(`sfx payment to pool as part of purchase`);

                                            break;
                                        }
                                        case 15: {
                                            console.log(`account creation`);
                                            console.log(`create account transaction`);

                                            let twm_formatted = false;
                                            let twitter_url = '';
                                            let facebook_url = '';
                                            let linkedin_url = '';
                                            let email_address = '';
                                            let avatar_image = '';
                                            let biography = '';
                                            let website = '';
                                            let location = '';
                                            let twm_version = 0;
                                            try {

                                                let user_detailed_data_raw = await daemon_parse_transaction(vout.target.script.data, 15);
                                                let user_detailed_data = user_detailed_data_raw.parsed_fields;
                                                console.log(user_detailed_data);
                                                let twm_description;
                                                try {
                                                    twm_description = JSON.parse(user_detailed_data[1].value);

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
                                                } catch (err) {
                                                    console.error(err);
                                                    console.error(`description is not parsable`);
                                                }
                                                try {
                                                    let save_obj = {};

                                                    save_obj.username = user_detailed_data[0].value;
                                                    save_obj.avatar_image = avatar_image;
                                                    save_obj.admin_approved = false;
                                                    save_obj.twitter_url = twitter_url;
                                                    save_obj.facebook_url = facebook_url;
                                                    save_obj.linkedin_url = linkedin_url;
                                                    save_obj.email_address = email_address;
                                                    save_obj.biography = twm_version === 1 ? biography : user_detailed_data[1].value;
                                                    save_obj.twm_formatted = twm_formatted;
                                                    save_obj.raw_description = user_detailed_data[1].value;
                                                    save_obj.block_height = got_block.block_header.height;
                                                    save_obj.pgp_public_key = '';
                                                    save_obj.pgp_fingerprint = '';
                                                    save_obj.website = website;
                                                    save_obj.location = location;
                                                    save_obj.safex_public_key = user_detailed_data[2].value;
                                                    save_obj.twm_version = twm_version;

                                                    let the_save = await save_user(save_obj);
                                                    console.log(the_save);

                                                    break;
                                                } catch (err) {
                                                    console.error(err);
                                                    console.error(`error at saving the user object at account creation output`);
                                                    process.exit();
                                                    break;
                                                }


                                            } catch(err) {

                                                console.error(err);
                                                console.error(`error at getting the user ${u_obj.username}`);
                                            }


                                            break;

                                        }
                                        case 16: {
                                            console.log(`account update txn`);
                                            break;
                                        }
                                        case 20: {
                                            console.log(`safex offer txn`);
                                            console.log(vout.target.script);
                                            console.log(last_block_scanned);

                                            let offer_detailed_data = await daemon_parse_transaction(vout.target.script.data, 20);
                                            console.log(offer_detailed_data);
                                            let offer_detailed_fields = offer_detailed_data.parsed_fields;
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
                                            let category = '';
                                            let nft = false;
                                            let shipping = false;
                                            let open_message = false;
                                            try {

                                                let twm_description = JSON.parse(offer_detailed_fields[2].value);

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
                                                    //physical = twm_description.physical;
                                                    //assume all items are physical for now.
                                                }
                                                if (twm_description.category) {
                                                    category = twm_description.category;
                                                }
                                                if(twm_description.shipping) {
                                                    shipping = twm_description.shipping;
                                                }
                                                if(twm_description.nft) {
                                                    nft = twm_description.nft;
                                                }
                                                if(twm_description.open_message) {
                                                    open_message = twm_description.open_message;
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                console.error(`offer description is not parsable`);
                                            }

                                            try {
                                                let save_obj = {};
                                                save_obj.offer_id = offer_detailed_fields[3].value;
                                                save_obj.username = offer_detailed_fields[0].value;
                                                save_obj.main_image = main_image;
                                                save_obj.admin_approved = false;
                                                save_obj.sku = sku;
                                                save_obj.title = offer_detailed_fields[1].value;
                                                save_obj.barcode = barcode;
                                                save_obj.weight = weight;
                                                save_obj.country = country;
                                                save_obj.nft = nft;
                                                save_obj.shipping = shipping;
                                                save_obj.open_message = open_message;
                                                save_obj.message_type = message_type;
                                                save_obj.twm_formatted = twm_formatted;
                                                save_obj.raw_description = offer_detailed_fields[2].value;
                                                save_obj.block_height = got_block.block_header.height;
                                                save_obj.physical = physical;
                                                save_obj.twm_version = twm_version;
                                                save_obj.min_price = offer_detailed_fields[6].value / 10000000000;
                                                save_obj.price = offer_detailed_fields[5].value / 10000000000;
                                                save_obj.oracle = offer_detailed_fields[9].value === '01' ? true : false;
                                                save_obj.oracle_id = offer_detailed_fields[4].value;
                                                save_obj.quantity = offer_detailed_fields[8].value;
                                                save_obj.description = description;
                                                save_obj.category = category;
                                                save_obj.active = offer_detailed_fields[7].value === '01' ? true : false;

                                                console.log(save_obj);
                                                let the_save = await save_offer(save_obj);
                                                console.log(the_save);

                                                break;
                                            } catch (err) {
                                                console.error(err);
                                                console.error(`error at saving the offer object at offer creation output`);
                                                break;
                                            }
                                        }
                                        case 21: {
                                            console.log(`edit offer txn`);
                                            console.log(vout.target.script);
                                            console.log(last_block_scanned);

                                            let edit_offer_detailed_data = await daemon_parse_transaction(vout.target.script.data, 21);

                                            let edit_offer_detailed_fields = edit_offer_detailed_data.parsed_fields;
                                            let edited_obj = {};
                                            for (const val of edit_offer_detailed_fields) {
                                                if (val.field == 'offer_id') {
                                                    edited_obj.offer_id = val.value;
                                                } else if (val.field == 'title') {
                                                    edited_obj.title = val.value;
                                                } else if (val.field == 'description') {
                                                    edited_obj.description = val.value;
                                                } else if (val.field == 'price_peg_id') {
                                                    edited_obj.price_peg_id = val.value;
                                                } else if (val.field == 'price') {
                                                    edited_obj.price = val.value;
                                                } else if (val.field == 'min_sfx_price') {
                                                    edited_obj.min_sfx_price = val.value;
                                                } else if (val.field == 'quantity') {
                                                    edited_obj.quantity = val.value;
                                                } else if (val.field == 'active') {
                                                    edited_obj.active = val.value;
                                                } else if (val.field == 'seller') {
                                                    edited_obj.seller = val.value;
                                                } else if (val.field == 'price_peg_used') {
                                                    edited_obj.price_peg_used = val.value;
                                                }
                                            }

                                            let offer_edit_o = {};
                                            offer_edit_o.offer_id = edited_obj.offer_id;
                                            offer_edit_o.edit_txid = txn.tx_hash;

                                            let save_edit_txn = await save_offer_edit_txn(offer_edit_o);

                                            console.log(save_edit_txn);


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
                                            let category = '';
                                            let nft = false;
                                            let shipping = false;
                                            let open_message = false;
                                            try {

                                                let twm_description = JSON.parse(edited_obj.description);

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
                                                    //physical = twm_description.physical;
                                                    //assume all items are physical for now.
                                                }
                                                if (twm_description.category) {
                                                    category = twm_description.category;
                                                }
                                                if(twm_description.shipping) {
                                                    shipping = twm_description.shipping;
                                                }
                                                if(twm_description.nft) {
                                                    nft = twm_description.nft;
                                                }
                                                if(twm_description.open_message) {
                                                    open_message = twm_description.open_message;
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                console.error(`offer description is not parsable`);
                                            }

                                            let current_offer = await get_offer_by_offer_id(edited_obj.offer_id);

                                            let edit_count = await get_offer_version_counts(edited_obj.offer_id);

                                            if (current_offer == 0) {

                                                break;

                                            }

                                            //get edit offer counts here

                                            console.log(current_offer.models[0]);
                                            let current_attributes = current_offer.models[0].attributes;

                                            console.log(edit_offer_detailed_data);
                                            console.log(`now exiting`);
                                            console.log(edited_obj);
                                            try {
                                                let save_obj = {};
                                                save_obj.offer_id = edited_obj.offer_id;
                                                save_obj.username = edited_obj.username;
                                                save_obj.main_image = main_image;
                                                save_obj.admin_approved = false;
                                                save_obj.sku = sku;
                                                save_obj.title = edited_obj.title;
                                                save_obj.barcode = barcode;
                                                save_obj.weight = weight;
                                                save_obj.country = country;
                                                save_obj.nft = nft;
                                                save_obj.shipping = shipping;
                                                save_obj.open_message = open_message;
                                                save_obj.message_type = message_type;
                                                save_obj.twm_formatted = twm_formatted;
                                                save_obj.raw_description = edited_obj.description;
                                                save_obj.block_height = got_block.block_header.height;
                                                save_obj.physical = physical;
                                                save_obj.twm_version = twm_version;
                                                save_obj.edit_version = edit_count;
                                                save_obj.min_price = edited_obj.min_sfx_price / 10000000000;
                                                save_obj.price = edited_obj.price / 10000000000;
                                                save_obj.oracle = edited_obj.price === '01' ? true : false;
                                                save_obj.oracle_id = edited_obj.price_peg_id;
                                                save_obj.quantity = edited_obj.quantity;
                                                save_obj.description = description;
                                                save_obj.category = category;
                                                save_obj.active = edited_obj.active === '01' ? true : false;
                                                if (current_attributes.admin_approved === true) {
                                                    save_obj.edit_admin_reapprove = true;
                                                }
                                                let saved = await save_edit_offer(edited_obj.offer_id, save_obj);
                                                console.log(`saved edit offer ${edited_obj.offer_id}`);
                                            } catch(err) {
                                                console.error(err);
                                            }



                                            //identify which offer was edited
                                            //then identify which fields were edited
                                            //then substitute them, and mark it edited, and admin unapproved
                                            //then add to the admin so when you can sort for edited and admin unapproved
                                            //should be flag, edited_awaiting_admin = true in this case if the product was already.
                                            //should add edited incrementor so we can version control

                                            break;
                                        }
                                        case 30: {
                                            console.log(`purchase offer txn`);
                                            console.log(vout.target.script);
                                            console.log(last_block_scanned);
                                            break;
                                        }
                                        case 40: {
                                            console.log(`feedback token`);
                                            break;
                                        }
                                        case 41: {
                                            console.log(`feedback txn`);
                                            break;
                                        }
                                        case 50: {
                                            console.log(`new price oracle txn`);
                                            break;
                                        }
                                        case 51: {
                                            console.log(`price oracle update txn`);
                                            break;
                                        }
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
    } catch (err) {
        console.error(err);
        console.error(`error at getting the block height`);
    }
}

main();