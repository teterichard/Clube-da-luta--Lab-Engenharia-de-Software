package br.mackenzie.topaai.dominio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes da classe Atividade")
class AtividadeTest {

    private Usuario organizador;
    private Usuario joao;
    private Usuario maria;
    private Atividade futebol;

    @BeforeEach
    void setUp() {
        organizador = new Usuario("Organizador", "org@topaai.com");
        joao = new Usuario("João", "joao@topaai.com");
        maria = new Usuario("Maria", "maria@topaai.com");
        futebol = new Atividade(organizador, "Futebol no parque",
                "futebol", "iniciante", "adultos", 2);
    }

    // ---------------------------------------------------------------
    // 1) Criação da atividade
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Caso 1: atividade válida nasce AGENDADA e com todas as vagas")
    void criarAtividadeValida() {
        assertEquals(StatusAtividadeEnum.AGENDADA, futebol.getStatus());
        assertEquals(2, futebol.getVagas());
        assertTrue(futebol.getParticipacoes().isEmpty());
    }

    @ParameterizedTest(name = "Caso {index}: capacidade {0} é inválida")
    @ValueSource(ints = {0, -1, -10})
    @DisplayName("Criar atividade com capacidade inválida lança exceção")
    void criarAtividadeComCapacidadeInvalida(int capacidade) {
        assertThrows(IllegalArgumentException.class, () ->
                new Atividade(organizador, "Vôlei", "volei", "iniciante", "adultos", capacidade));
    }

    @Test
    @DisplayName("Criar atividade sem organizador ou sem título lança exceção")
    void criarAtividadeSemDadosObrigatorios() {
        // Caso 1: sem organizador
        assertThrows(IllegalArgumentException.class, () ->
                new Atividade(null, "Vôlei", "volei", "iniciante", "adultos", 10));
        // Caso 2: sem título
        assertThrows(IllegalArgumentException.class, () ->
                new Atividade(organizador, " ", "volei", "iniciante", "adultos", 10));
    }

    // ---------------------------------------------------------------
    // 2) Solicitar participação (CT-01, CT-02, CT-04)
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Solicitar participação: sucesso gera PENDENTE e usuário nulo é bloqueado")
    void solicitarParticipacao() {
        // Caso 1: usuário logado com vaga disponível -> PENDENTE
        Participacao p = futebol.solicitarParticipacao(joao);
        assertEquals(StatusParticipacaoEnum.PENDENTE, p.getStatus());
        assertEquals(1, futebol.getParticipacoes().size());

        // Caso 2: usuário não logado (null) -> exceção (CT-02)
        assertThrows(IllegalArgumentException.class, () -> futebol.solicitarParticipacao(null));
    }

    @Test
    @DisplayName("Atividade sem vagas bloqueia novas solicitações (CT-04)")
    void atividadeSemVagas() {
        Atividade corrida = new Atividade(organizador, "Corrida no parque",
                "corrida", "iniciante", "adultos", 1);
        corrida.solicitarParticipacao(joao).confirmar();

        // Caso 1: vagas zeradas
        assertEquals(0, corrida.getVagas());
        assertFalse(corrida.temVaga());

        // Caso 2: nova solicitação é recusada e nada é criado
        IllegalStateException erro = assertThrows(IllegalStateException.class,
                () -> corrida.solicitarParticipacao(maria));
        assertEquals("Atividade sem vagas", erro.getMessage());
        assertEquals(1, corrida.getParticipacoes().size());
    }

    // ---------------------------------------------------------------
    // 3) Regras de duplicidade (CT-06)
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Impede solicitação duplicada e inscrição do próprio organizador")
    void impedirDuplicidade() {
        futebol.solicitarParticipacao(joao);

        // Caso 1: mesmo usuário tenta de novo
        IllegalStateException erro = assertThrows(IllegalStateException.class,
                () -> futebol.solicitarParticipacao(joao));
        assertEquals("Solicitação já enviada", erro.getMessage());

        // Caso 2: organizador tenta se inscrever na própria atividade
        assertThrows(IllegalStateException.class,
                () -> futebol.solicitarParticipacao(organizador));

        assertEquals(1, futebol.getParticipacoes().size());
    }

    // ---------------------------------------------------------------
    // 4) Aprovação e rejeição (CT-01 passo 7, CT-05)
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Aceitar desconta vaga; rejeitar não desconta")
    void aceitarERejeitarParticipacao() {
        Participacao pJoao = futebol.solicitarParticipacao(joao);
        Participacao pMaria = futebol.solicitarParticipacao(maria);

        // Caso 1: organizador aceita -> vaga descontada
        pJoao.confirmar();
        assertEquals(StatusParticipacaoEnum.ACEITO, pJoao.getStatus());
        assertEquals(1, futebol.getVagas());

        // Caso 2: organizador rejeita -> vaga continua igual
        pMaria.rejeitar();
        assertEquals(StatusParticipacaoEnum.REJEITADO, pMaria.getStatus());
        assertEquals(1, futebol.getVagas());
    }

    // ---------------------------------------------------------------
    // 5) Ciclo de vida (status)
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Transições de status: cancelar e concluir")
    void cicloDeVida() {
        // Caso 1: AGENDADA -> ATIVA -> CONCLUIDA; concluída não pode ser cancelada
        futebol.iniciar();
        assertEquals(StatusAtividadeEnum.ATIVA, futebol.getStatus());
        futebol.concluir();
        assertEquals(StatusAtividadeEnum.CONCLUIDA, futebol.getStatus());
        assertThrows(IllegalStateException.class, () -> futebol.cancelar());

        // Caso 2: atividade cancelada não aceita inscrições
        Atividade basquete = new Atividade(organizador, "Basquete", "basquete",
                "intermediario", "adultos", 10);
        basquete.cancelar();
        assertEquals(StatusAtividadeEnum.CANCELADA, basquete.getStatus());
        assertThrows(IllegalStateException.class, () -> basquete.solicitarParticipacao(joao));
    }

    // ---------------------------------------------------------------
    // 6) Filtros (CT-03, CT-07)
    // ---------------------------------------------------------------
    @ParameterizedTest(name = "Caso {index}: modalidade={0}, nivel={1}, publico={2} -> {3}")
    @CsvSource(value = {
            "futebol, iniciante, adultos, true",   // todos os filtros batem (CT-07)
            "FUTEBOL, NULL, NULL, true",           // um filtro só, ignorando maiúsculas
            "surf, NULL, NULL, false",             // nenhuma atividade de surf (CT-03)
            "futebol, avancado, adultos, false"    // um filtro não bate -> excluída
    }, nullValues = "NULL")
    @DisplayName("Filtros combinados de modalidade, nível e público-alvo")
    void filtrarAtividades(String modalidade, String nivel, String publico, boolean esperado) {
        assertEquals(esperado, futebol.atendeFiltros(modalidade, nivel, publico));
    }
}
