
exports.up = function (knex) {
    return knex.schema.createTable('orders', function (table) {
        table.increments('id').primary();

        table.string('recipient', 255).nullable();
        table.string('phone', 255).nullable();
        table.string('address', 255).nullable();
        table.enum('status', ['pending', 'delivered', 'cancelled', 'issue']).defaultTo('pending');

        table.integer('delivery_id').unsigned().nullable()
            .references('id').inTable('delivery').onDelete('CASCADE');
        table.integer('admin_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');

        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('orders');
};
