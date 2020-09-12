exports.up = (knex) => {
    return knex.schema
        .createTable('users', (table) => {
            table.increments('id').unsigned().primary();
            table.string('username', '64').unique();
            table.boolean('approved_flag').defaultTo(false);
            table.string('avatar_image', '500');
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
            table.string('registration_message', '2000');
        })
        .createTable('offers', (table) => {
            table.increments('id').primary();
            table.string('offer_id');
            table.string('username');
            table.string('title');
            table.string('description');
            table.string('raw_description', '8000');
            table.string('main_image', '500');
            table.string('sku');
            table.string('barcode');
            table.string('weight');
            table.string('country');
            table.string('category');
            table.string('message_type');
            table.integer('block_height');
            table.boolean('physical').defaultTo(true);
            table.float('price', 10,20);
            table.float('min_price', 10, 20);
            table.boolean('oracle');
            table.string('oracle_id');
            table.float('quantity', 20, 0);
            table.integer('twm_version');
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
        .createTable('conversations', (table) => {
            table.bigIncrements('id').primary();
            table.string('convo_id').unique();
            table.string('subject');
            table.string('offer_id');
            table.string('originator_pgp_key');
            table.string('receiver_pgp_key');
            table.string('status');
            table.timestamp('time_initiated').defaultTo(null);
            table.timestamp('time_last_message').defaultTo(null);
        })
        .createTable('messages', (table) => {
            table.bigIncrements('id').primary();
            table.string('subject');
            table.string('offer_id');
            table.string('convo_id').references('conversations.convo_id');
            table.string('encrypted_message');
            table.string('message_signature');
            table.string('convo_message_index');
        });
};

exports.down = (knex) => {
    return knex.schema
        .dropTable('users')
        .dropTable('offers')
        .dropTable('messages')
        .dropTable('conversations')
        .dropTable('offer_images');
};
