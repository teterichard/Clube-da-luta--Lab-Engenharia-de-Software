package br.mackenzie.topaai.dominio;

import java.time.LocalDateTime;

/**
 * Solicitação de um usuário para participar de uma atividade.
 * Nasce PENDENTE e o organizador confirma (ACEITO) ou rejeita (REJEITADO).
 */
public class Participacao {

    private final Usuario participante;
    private final Atividade atividade;
    private final LocalDateTime dataSolicitacao;
    private StatusParticipacaoEnum status;

    public Participacao(Usuario participante, Atividade atividade) {
        this.participante = participante;
        this.atividade = atividade;
        this.dataSolicitacao = LocalDateTime.now();
        this.status = StatusParticipacaoEnum.PENDENTE;
    }

    public void confirmar() {
        if (status != StatusParticipacaoEnum.PENDENTE) {
            throw new IllegalStateException("Solicitação já foi respondida");
        }
        if (!atividade.temVaga()) {
            throw new IllegalStateException("Atividade sem vagas");
        }
        status = StatusParticipacaoEnum.ACEITO;
    }

    public void rejeitar() {
        if (status != StatusParticipacaoEnum.PENDENTE) {
            throw new IllegalStateException("Solicitação já foi respondida");
        }
        status = StatusParticipacaoEnum.REJEITADO;
    }

    public StatusParticipacaoEnum getStatus() {
        return status;
    }

    public Usuario getParticipante() {
        return participante;
    }

    public Atividade getAtividade() {
        return atividade;
    }

    public LocalDateTime getDataSolicitacao() {
        return dataSolicitacao;
    }
}
