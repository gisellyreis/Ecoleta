import Knex from 'knex';

// Criar tabela
export async function up(knex: Knex) {
    return knex.schema.createTable('items', table => {
        table.increments('id').primary();
        table.string('image').notNullable();
        table.string('title').notNullable();
    });
}

// Deletar tabela
export async function down(knex: Knex) {
    return knex.schema.dropTable('items');
}