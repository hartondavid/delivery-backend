
exports.up = function (knex) {
    return knex.schema.createTable('routes', function (table) {
        table.increments('id').primary();

        table.string('area', 255).nullable();

        table.integer('admin_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');

        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('routes');
};
