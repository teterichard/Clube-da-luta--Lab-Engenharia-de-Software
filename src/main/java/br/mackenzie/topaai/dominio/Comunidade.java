package br.mackenzie.topaai.dominio;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Comunidade representa um grupo de usuários com interesses em comum.
 * Comunidades públicas permitem acesso geral; privadas restringem participação.
 */
public class Comunidade {

    private final String id;
    private final String nome;
    private final String descricao;
    private final StatusVisibilidadeEnum statusVisibilidade;
    private final LocalDateTime dataCriacao;
    private final Set<Usuario> membros = new HashSet<>();

    public Comunidade(String id, String nome, String descricao,
                      StatusVisibilidadeEnum statusVisibilidade, LocalDateTime dataCriacao) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("ID da comunidade é obrigatório");
        }
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("Nome da comunidade é obrigatório");
        }
        if (descricao == null || descricao.isBlank()) {
            throw new IllegalArgumentException("Descrição da comunidade é obrigatória");
        }
        if (statusVisibilidade == null) {
            throw new IllegalArgumentException("Status de visibilidade é obrigatório");
        }
        if (dataCriacao == null) {
            throw new IllegalArgumentException("Data de criação é obrigatória");
        }

        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.statusVisibilidade = statusVisibilidade;
        this.dataCriacao = dataCriacao;
    }

    public void adicionarMembro(Usuario usuario) {
        if (usuario == null) {
            throw new IllegalArgumentException("Usuário é obrigatório");
        }
        membros.add(usuario);
    }

    public void removerMembro(Usuario usuario) {
        if (usuario == null) {
            throw new IllegalArgumentException("Usuário é obrigatório");
        }
        membros.remove(usuario);
    }

    public boolean ehPublica() {
        return statusVisibilidade == StatusVisibilidadeEnum.PUBLICA;
    }

    public String getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public StatusVisibilidadeEnum getStatusVisibilidade() {
        return statusVisibilidade;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public Set<Usuario> getMembros() {
        return Collections.unmodifiableSet(membros);
    }
}
