package br.mackenzie.topaai.dominio;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Atividade esportiva/social do Topa-aí.
 * Baseada no Diagrama de Classes de Projeto da wiki (caso de uso principal:
 * "Inscrever-se em atividade").
 */
public class Atividade {

    private final Usuario organizador;
    private final String titulo;
    private final String modalidade;
    private final String nivel;
    private final String publicoAlvo;
    private final int capacidadeMaxima;
    private StatusAtividadeEnum status;
    private final List<Participacao> participacoes = new ArrayList<>();

    public Atividade(Usuario organizador, String titulo, String modalidade,
                     String nivel, String publicoAlvo, int capacidadeMaxima) {
        if (organizador == null) {
            throw new IllegalArgumentException("Organizador é obrigatório");
        }
        if (titulo == null || titulo.isBlank()) {
            throw new IllegalArgumentException("Título é obrigatório");
        }
        if (capacidadeMaxima <= 0) {
            throw new IllegalArgumentException("Capacidade máxima deve ser maior que zero");
        }
        this.organizador = organizador;
        this.titulo = titulo;
        this.modalidade = modalidade;
        this.nivel = nivel;
        this.publicoAlvo = publicoAlvo;
        this.capacidadeMaxima = capacidadeMaxima;
        this.status = StatusAtividadeEnum.AGENDADA;
    }

    /** Vagas restantes = capacidade - participações ACEITAS. */
    public int getVagas() {
        long aceitos = participacoes.stream()
                .filter(p -> p.getStatus() == StatusParticipacaoEnum.ACEITO)
                .count();
        return capacidadeMaxima - (int) aceitos;
    }

    public boolean temVaga() {
        return getVagas() > 0;
    }

    /**
     * Usuário solicita participação (CT-01, CT-04, CT-06 do plano de testes).
     */
    public Participacao solicitarParticipacao(Usuario usuario) {
        if (usuario == null) {
            throw new IllegalArgumentException("Necessário estar logado");
        }
        if (status == StatusAtividadeEnum.CANCELADA || status == StatusAtividadeEnum.CONCLUIDA) {
            throw new IllegalStateException("Atividade não aceita inscrições");
        }
        if (usuario == organizador) {
            throw new IllegalStateException("Organizador não pode se inscrever na própria atividade");
        }
        if (!temVaga()) {
            throw new IllegalStateException("Atividade sem vagas");
        }
        boolean jaSolicitou = participacoes.stream()
                .anyMatch(p -> p.getParticipante() == usuario
                        && p.getStatus() != StatusParticipacaoEnum.REJEITADO);
        if (jaSolicitou) {
            throw new IllegalStateException("Solicitação já enviada");
        }
        Participacao participacao = new Participacao(usuario, this);
        participacoes.add(participacao);
        return participacao;
    }

    /** Verifica se a atividade atende a todos os filtros informados (null = ignorar filtro). */
    public boolean atendeFiltros(String modalidade, String nivel, String publicoAlvo) {
        return combina(this.modalidade, modalidade)
                && combina(this.nivel, nivel)
                && combina(this.publicoAlvo, publicoAlvo);
    }

    private boolean combina(String valor, String filtro) {
        return filtro == null || filtro.equalsIgnoreCase(valor);
    }

    public void iniciar() {
        if (status != StatusAtividadeEnum.AGENDADA) {
            throw new IllegalStateException("Só é possível iniciar uma atividade agendada");
        }
        status = StatusAtividadeEnum.ATIVA;
    }

    public void cancelar() {
        if (status == StatusAtividadeEnum.CONCLUIDA) {
            throw new IllegalStateException("Atividade concluída não pode ser cancelada");
        }
        status = StatusAtividadeEnum.CANCELADA;
    }

    public void concluir() {
        if (status != StatusAtividadeEnum.ATIVA) {
            throw new IllegalStateException("Só é possível concluir uma atividade ativa");
        }
        status = StatusAtividadeEnum.CONCLUIDA;
    }

    public StatusAtividadeEnum getStatus() {
        return status;
    }

    public List<Participacao> getParticipacoes() {
        return Collections.unmodifiableList(participacoes);
    }

    public Usuario getOrganizador() {
        return organizador;
    }

    public String getTitulo() {
        return titulo;
    }

    public int getCapacidadeMaxima() {
        return capacidadeMaxima;
    }
}
