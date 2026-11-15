const { criarTravaMemoria } = require('../src/repositories/travaMemoria');

const esperar = (ms) => new Promise((r) => { setTimeout(r, ms); });

describe('Trava por atividade (memória)', () => {
  test('mesma atividade roda em sequência; atividades diferentes, em paralelo', async () => {
    const comTrava = criarTravaMemoria({});
    const ordem = [];
    const tarefa = (nome, ms) => async () => {
      ordem.push(`início ${nome}`);
      await esperar(ms);
      ordem.push(`fim ${nome}`);
    };

    await Promise.all([
      comTrava(1, tarefa('A1', 20)),
      comTrava(1, tarefa('A2', 1)),
      comTrava(2, tarefa('B', 1)),
    ]);

    expect(ordem.indexOf('fim A1')).toBeLessThan(ordem.indexOf('início A2'));
    expect(ordem.indexOf('fim B')).toBeLessThan(ordem.indexOf('fim A1'));
  });

  test('um erro é repassado a quem chamou e não trava a fila', async () => {
    const comTrava = criarTravaMemoria({ repo: 'x' });
    await expect(comTrava(1, async () => { throw new Error('falhou'); })).rejects.toThrow('falhou');
    await expect(comTrava(1, async (repos) => repos.repo)).resolves.toBe('x');
  });
});
