/**
 * Trava por atividade para execução em memória: operações sobre a mesma atividade
 * rodam uma de cada vez (fila de promises); atividades diferentes não se bloqueiam.
 * É o equivalente, sem banco, ao SELECT ... FOR UPDATE da versão MySQL.
 */
function criarTravaMemoria(repositorios) {
  const filas = new Map();

  return async function comTrava(atividadeId, fn) {
    const chave = String(atividadeId);
    const anterior = filas.get(chave) || Promise.resolve();
    const atual = anterior.catch(() => {}).then(() => fn(repositorios));
    const fim = atual.catch(() => {});
    filas.set(chave, fim);
    fim.then(() => {
      if (filas.get(chave) === fim) filas.delete(chave);
    });
    return atual;
  };
}

module.exports = { criarTravaMemoria };
