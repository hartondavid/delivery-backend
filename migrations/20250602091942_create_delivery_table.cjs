
exports.up = function (knex) {
    return knex.schema.createTable('delivery', function (table) {
        table.increments('id').primary();
        table.integer('admin_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');
        table.integer('courier_id').unsigned().nullable()
            .references('id').inTable('users').onDelete('SET NULL');


        table.timestamps(true, true);
    });

};

exports.down = function (knex) {
    return knex.schema.dropTable('delivery');
};
