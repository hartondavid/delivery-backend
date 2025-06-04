
exports.up = function (knex) {
    return knex.schema.createTable('issues', function (table) {
        table.increments('id').primary();
        table.string('description').nullable();
        table.integer('delivery_id').unsigned().notNullable()
            .references('id').inTable('delivery').onDelete('CASCADE');


        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('issues');
};
