const request = require('supertest');
const jwt = require('jsonwebtoken');
const { criarApp } = require('../src/app');
const { criarParticipacaoRepositoryMemoria } = require('../src/repositories/participacaoRepositoryMemoria');

/**
 * Aceites simultâneos não podem ultrapassar o número de integrantes
 * (próxima etapa 4 do plano de inscrição: trava por atividade).
 */
const SEGREDO = 'segredo-de-teste';
const AGORA = new Date('2026-11-10T12:00:00-03:00');
/** Simula um banco lento: a leitura demora, então requisições simultâneas se intercalam. */
function repositorioLento() {
  const repo = criarParticipacaoRepositoryMemoria();
  const listar = repo.listarPorAtividade;
  repo.listarPorAtividade = async (id) => {
    const lista = await listar(id);
    await new Promise((r) => { setTimeout(r, 20); });
    return lista;
  };
  return repo;
}

const auth = (sub) => ({ Authorization: `Bearer ${jwt.sign({ sub, nome: `u${sub}` }, SEGREDO)}` });

describe('Concorrência no aceite — API', () => {
  test('dois aceites ao mesmo tempo para a última vaga: só um passa', async () => {
    const app = criarApp({ jwtSegredo: SEGREDO, relogio: () => AGORA, participacaoRepository: repositorioLento() });
    const atividade = (await request(app).post('/api/atividades').set(auth(1)).send({
      titulo: 'Tênis em dupla',
      tipo: 'outro',
      nivel: 'avancado',
      publicoAlvo: 'todos',
      dataHora: '2026-11-21T08:00:00-03:00',
      local: 'Clube',
      numeroIntegrantes: 2,
    })).body;

    const pedidos = [];
    for (const sub of [2, 3, 4]) {
      pedidos.push((await request(app).post(`/api/atividades/${atividade.id}/participacoes`).set(auth(sub))).body);
    }

    const respostas = await Promise.all(pedidos.map((p) => request(app)
      .patch(`/api/participacoes/${p.id}`).set(auth(1)).send({ decisao: 'ACEITAR' })));

    expect(respostas.map((r) => r.status).sort()).toEqual([200, 200, 409]);
    const detalhe = await request(app).get(`/api/atividades/${atividade.id}`).set(auth(1));
    expect(detalhe.body.vagas).toBe(0);
  });
});
