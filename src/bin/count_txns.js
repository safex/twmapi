/*
In this gist you will find the functions for getting a block from a safex blockchain full node.
After obtaining a block at an incremental height, it will scan through the transaction contents
of that block and sort through the transaction types counting how many of each transaction were created until the top height.

You will need to plug this program into a nodejs project with axios installed. So you must create a package.json in the same
directory with this script.

The port set on the blockheight and block content are set to 29393 which is for testnet mainnet is 17402
stagenet port is 30393
*/

import axios from 'axios';

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

var last_block_scanned = 85000;
var users_arr = [];

let txn_counter = {};

txn_counter.stake_txn = 0;
txn_counter.pool_payment = 0;
txn_counter.account_creation_txn = 0;
txn_counter.account_edit_txn = 0;
txn_counter.offer_txn = 0;
txn_counter.offer_edit_txn = 0;
txn_counter.purchase_txn = 0;
txn_counter.feedback_token_txn = 0;
txn_counter.feedback_creation_txn = 0;
txn_counter.price_oracle_txn = 0;
txn_counter.price_oracle_edit_txn = 0;

async function main() {
    try {
        //get top block, then loop
        let top_block = await get_height();
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
                                        case 11: {
                                            console.log(`stake token txn`);
                                            txn_counter.stake_txn += 1;
                                            break;
                                        };
                                        case 12: {
                                            console.log(`sfx payment to pool from purchase txn`);
                                            txn_counter.pool_payment += 1;
                                            break;
                                        };
                                        case 15: {
                                            console.log(`account creation`);
                                            txn_counter.account_creation_txn += 1;
                                            break;
                                        };
                                        case 16: {
                                            console.log(`account update txn`);
                                            txn_counter.account_edit_txn += 1;
                                            break;
                                        };
                                        case 20: {
                                            console.log(`safex offer txn`);
                                            txn_counter.offer_txn += 1;
                                            break;
                                        };
                                        case 21: {
                                            console.log(`edit offer txn`);
                                            txn_counter.offer_edit_txn += 1;
                                            break;
                                        };
                                        case 30: {
                                            console.log(`purchase offer txn`);
                                            txn_counter.purchase_txn += 1;
                                            break;
                                        };
                                        case 40: {
                                            console.log(`feedback token`);
                                            txn_counter.feedback_token_txn += 1;
                                            break;
                                        };
                                        case 41: {
                                            console.log(`feedback txn`);
                                            txn_counter.feedback_creation_txn += 1;
                                            break;
                                        };
                                        case 50: {
                                            console.log(`new price oracle txn`);
                                            txn_counter.price_oracle_txn += 1;
                                            break;
                                        };
                                        case 51: {
                                            console.log(`price oracle update txn`);
                                            txn_counter.price_oracle_edit_txn += 1;
                                            break;
                                        };
                                    }
                                } else {
                                    console.log(`no script present in this transaction`);
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
        console.log(txn_counter);
    } catch (err) {
        console.error(err);
        console.error(`error at getting the block height`);
    }
}

main();