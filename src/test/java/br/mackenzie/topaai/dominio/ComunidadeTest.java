package br.mackenzie.topaai.dominio;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes da classe Comunidade")
class ComunidadeTest {

    @Test
    @DisplayName("Comunidade válida nasce com dados corretos")
    void criarComunidadeValida() {
        LocalDateTime agora = LocalDateTime.of(2026, 10, 27, 18, 0);
        Usuario usuario = new Usuario("Ana", "ana@topaai.com");

        Comunidade comunidade = new Comunidade(
                "c-001",
                "Mãos na Bola",
                "Grupo para praticar futebol e conhecer pessoas",
                StatusVisibilidadeEnum.PUBLICA,
                agora
        );

        assertEquals("c-001", comunidade.getId());
        assertEquals("Mãos na Bola", comunidade.getNome());
        assertEquals(StatusVisibilidadeEnum.PUBLICA, comunidade.getStatusVisibilidade());
        assertEquals(agora, comunidade.getDataCriacao());
        assertTrue(comunidade.getMembros().isEmpty());
        assertTrue(comunidade.ehPublica());
    }

    @Test
    @DisplayName("Adicionar e remover membros da comunidade")
    void adicionarRemoverMembros() {
        Comunidade comunidade = new Comunidade(
                "c-002",
                "Lutas em Grupo",
                "Comunidade de treino e apoio",
                StatusVisibilidadeEnum.PRIVADA,
                LocalDateTime.now()
        );

        Usuario joao = new Usuario("João", "joao@topaai.com");
        Usuario maria = new Usuario("Maria", "maria@topaai.com");

        comunidade.adicionarMembro(joao);
        comunidade.adicionarMembro(maria);

        assertEquals(2, comunidade.getMembros().size());
        assertTrue(comunidade.getMembros().contains(joao));

        comunidade.removerMembro(joao);
        assertEquals(1, comunidade.getMembros().size());
        assertFalse(comunidade.getMembros().contains(joao));
    }

    @Test
    @DisplayName("Dados obrigatórios e visibilidade devem ser válidos")
    void validarDadosObrigatorios() {
        LocalDateTime agora = LocalDateTime.now();

        assertThrows(IllegalArgumentException.class,
                () -> new Comunidade(null, "Nome", "Descrição", StatusVisibilidadeEnum.PUBLICA, agora));
        assertThrows(IllegalArgumentException.class,
                () -> new Comunidade("c-003", " ", "Descrição", StatusVisibilidadeEnum.PUBLICA, agora));
        assertThrows(IllegalArgumentException.class,
                () -> new Comunidade("c-004", "Nome", null, StatusVisibilidadeEnum.PUBLICA, agora));
        assertThrows(IllegalArgumentException.class,
                () -> new Comunidade("c-005", "Nome", "Descrição", null, agora));
        assertThrows(IllegalArgumentException.class,
                () -> new Comunidade("c-006", "Nome", "Descrição", StatusVisibilidadeEnum.PUBLICA, null));
    }
}
