const REPOSITORIO = 'https://github.com/teterichard/Clube-da-luta--Lab-Engenharia-de-Software'

// Contato: o que é o Topa-aí e como falar com a equipe (projeto do Laboratório de Engenharia de Software)
function Contato() {
  return (
    <main id="conteudo" className="pagina pagina_estreita">
      <h1 className="pagina-titulo">Contato</h1>
      <p className="pagina-subtitulo">Dúvidas, sugestões ou encontrou algum problema? Fale com a gente.</p>

      <section className="painel" aria-labelledby="titulo-sobre">
        <h2 id="titulo-sobre" className="secao-titulo">Sobre o Topa-aí</h2>
        <p className="texto-corrido">
          O Topa-aí reúne num só lugar atividades físicas e eventos sociais: você encontra gente com o mesmo
          interesse e nível, organiza encontros e não perde mais convite em grupo de mensagem. É um projeto
          acadêmico da disciplina Laboratório de Engenharia de Software, ligado às ODS 3 (saúde e bem-estar),
          10 (redução das desigualdades) e 11 (cidades e comunidades sustentáveis).
        </p>
      </section>

      <section className="painel" aria-labelledby="titulo-falar">
        <h2 id="titulo-falar" className="secao-titulo">Como falar com a equipe</h2>
        <ul className="lista-contato">
          <li>
            <strong>Encontrou um erro ou tem uma ideia?</strong>
            <span>Abra uma issue no repositório do projeto, contando o que aconteceu e em qual tela.</span>
            <a className="btn btn_pequeno" href={`${REPOSITORIO}/issues/new`} target="_blank" rel="noreferrer">
              Abrir uma issue <span className="sr-only">(abre em nova aba)</span>
            </a>
          </li>
          <li>
            <strong>Quer entender o projeto a fundo?</strong>
            <span>A wiki tem o contexto de negócio, as personas e os casos de uso.</span>
            <a className="btn btn_pequeno btn_cinza" href={`${REPOSITORIO}/wiki`} target="_blank" rel="noreferrer">
              Ver a wiki <span className="sr-only">(abre em nova aba)</span>
            </a>
          </li>
        </ul>
      </section>
    </main>
  )
}

export default Contato
