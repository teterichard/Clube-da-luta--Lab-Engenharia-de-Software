package br.mackenzie.topaai.dominio;

/**
 * Versão simplificada da classe Usuario (apenas o necessário para Atividade).
 */
public class Usuario {

    private final String nome;
    private final String email;

    public Usuario(String nome, String email) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("Nome é obrigatório");
        }
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("E-mail inválido");
        }
        this.nome = nome;
        this.email = email;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }
}
