/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('user_rights').del()
  await knex('user_rights').insert([
    { id: 1, user_id: 1, right_id: 1 },
    { id: 2, user_id: 2, right_id: 2 }
  ]);
}
