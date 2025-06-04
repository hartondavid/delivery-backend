
exports.up = function (knex) {
    return knex.schema.createTable('user_routes', function (table) {
        table.increments('id').primary();

        table.integer('courier_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');

        table.integer('route_id').unsigned().notNullable()
            .references('id').inTable('routes').onDelete('CASCADE');

        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('user_routes');
};
