exports.up = (knex) => {
    return knex.schema
        .createTable('users', (table) => {
            table.increments('id').unsigned().primary();
            table.string('username', '64').unique();
            table.boolean('approved_flag').defaultTo(false);
            table.string('avatar_image', '2000');
            table.string('twitter_url');
            table.string('facebook_url');
            table.string('linkedin_url');
            table.string('email_address');
            table.boolean('twm_formatted').defaultTo(false);
            table.boolean('admin_approved').defaultTo(false);
            table.timestamp('admin_rejected').defaultTo(null);
            table.string('admin_rejected_reason').defaultTo('');
            table.integer('twm_version');
            table.string('raw_description', '8000');
            table.string('safex_public_key');
            table.string('biography', '2000');
            table.string('pgp_public_key', '2500');
            table.string('website');
            table.string('location');
            table.integer('block_height');
            table.string('pgp_fingerprint');
            table.string('registration_message', '8000');
        })
        .createTable('offers', (table) => {
            table.increments('id').primary();
            table.string('offer_id');
            table.string('username');
            table.string('title');
            table.string('description', '2000');
            table.string('raw_description', '8000');
            table.string('main_image', '2000');
            table.string('sku');
            table.string('barcode');
            table.string('weight');
            table.string('country');
            table.string('category');
            table.string('type');
            table.string('message_type');
            table.integer('block_height');
            table.boolean('open_message');
            table.boolean('shipping');
            table.boolean('nft');
            table.boolean('physical').defaultTo(true);
            table.float('price', 10,20);
            table.float('min_price', 10, 20);
            table.boolean('oracle');
            table.string('oracle_id');
            table.boolean('active');
            table.boolean('edit_admin_reapprove').defaultTo(false);
            table.float('quantity', 20, 0);
            table.integer('twm_version');
            table.integer('edit_version').defaultTo(0);
            table.boolean('admin_approved').defaultTo(false);
            table.boolean('twm_formatted').defaultTo(false);
            table.timestamp('admin_rejected').defaultTo(null);
            table.string('admin_rejected_reason');
            table.string('messaging_policy');
        })
        .createTable('offer_images', (table) => {
            table.bigIncrements('id').primary();
            table.string('title');
            table.boolean('approved_flag').defaultTo(false);
            table.boolean('twm_formatted').defaultTo(false);
            table.timestamp('admin_rejected').defaultTo(null);
            table.string('admin_rejected_reason');
        })
        .createTable('offer_edits', (table) => {
            table.bigIncrements('id').primary();
            table.string('offer_id');
            table.string('edit_txid').unique();
            table.timestamp('timestamp').defaultTo(null);
        })
        .createTable('messages', (table) => {
            table.bigIncrements('id').primary();
            table.string('order_id');
            table.string('msg_id');
            table.string('from');
            table.string('to');
            table.string('message');
            table.string('type');
            table.string('purchase_proof');
            table.string('message_hash');
            table.string('message_signature');
            table.string('sender_pgp_pub_key');
            table.timestamp('timestamp').defaultTo(null);
        });
};

exports.down = (knex) => {
    return knex.schema
        .dropTable('users')
        .dropTable('offers')
        .dropTable('messages')
        .dropTable('offer_images')
        .dropTable('offer_edits');
};
