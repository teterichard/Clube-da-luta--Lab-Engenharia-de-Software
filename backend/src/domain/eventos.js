/**
 * Padrão Observer (plano de inscrição, próxima etapa 1): os casos de uso só publicam
 * eventos de domínio ("participacao.respondida", "convite.criado"...) e quem se interessa
 * assina. Assim a notificação fica desacoplada de solicitar/aceitar/convidar.
 *
 * Uma falha num observador é registrada e não desfaz a ação que gerou o evento.
 */
const Eventos = Object.freeze({
  PARTICIPACAO_SOLICITADA: 'participacao.solicitada',
  PARTICIPACAO_RESPONDIDA: 'participacao.respondida',
  PARTICIPACAO_CANCELADA: 'participacao.cancelada',
  CONVITE_CRIADO: 'convite.criado',
  CONVITE_RESPONDIDO: 'convite.respondido',
  ATIVIDADE_EDITADA: 'atividade.editada',
  ATIVIDADE_CANCELADA: 'atividade.cancelada',
  COMUNIDADE_PEDIDO_ENTRADA: 'comunidade.pedidoEntrada',
  COMUNIDADE_PEDIDO_RESPONDIDO: 'comunidade.pedidoRespondido',
});

function criarPublicador({ aoFalhar = (erro) => console.error('Falha ao tratar evento:', erro) } = {}) {
  const assinantes = new Map();

  return {
    /** Registra um observador; devolve uma função para cancelar a assinatura. */
    assinar(tipo, observador) {
      if (!assinantes.has(tipo)) assinantes.set(tipo, []);
      assinantes.get(tipo).push(observador);
      return () => {
        assinantes.set(tipo, assinantes.get(tipo).filter((o) => o !== observador));
      };
    },

    /** Avisa todos os observadores do tipo e espera terminarem (sem propagar erros). */
    async publicar(tipo, dados) {
      const lista = assinantes.get(tipo) || [];
      await Promise.all(lista.map(async (observador) => {
        try {
          await observador(dados);
        } catch (erro) {
          aoFalhar(erro, tipo);
        }
      }));
    },
  };
}

module.exports = { Eventos, criarPublicador };
