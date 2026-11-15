-- Permite que o usuário da aplicação crie e apague o banco usado pelos testes de integração (npm run test:mysql).
GRANT ALL PRIVILEGES ON `topaai_teste`.* TO 'topaai'@'%';
FLUSH PRIVILEGES;
