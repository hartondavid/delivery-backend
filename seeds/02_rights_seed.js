/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('rights').del()
  await knex('rights').insert([
    { id: 1, name: 'admin', right_code: 1 },
    { id: 2, name: 'courier', right_code: 2 }

  ]);
}
