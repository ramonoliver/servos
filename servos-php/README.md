# Servos PHP

Nova versao do Servos em **Laravel**, criada para funcionar melhor em hospedagem compartilhada como a **Hostgator**.

## O que esta pronto

- autenticacao com sessao do Laravel
- dashboard com metricas principais
- listagem de ministerios
- listagem de membros
- listagem de escalas
- seed demo para testar a aplicacao logo apos o migrate
- interface Blade com CSS estatico em `public/css/app.css`

## Demo local

Depois de rodar o setup:

```bash
email: ramon@servosapp.com
senha: servos2026
```

## Rodar localmente

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
php artisan serve
```

Abra `http://127.0.0.1:8000`.

## MySQL na Hostgator

No painel da hospedagem, crie um banco MySQL e ajuste o `.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://seu-dominio.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=servos_php
DB_USERNAME=servos_user
DB_PASSWORD=sua_senha
```

Depois execute:

```bash
php artisan migrate --force
php artisan db:seed --force
```

## Publicacao em shared hosting

1. Envie os arquivos do projeto para uma pasta fora do `public_html`, por exemplo `/home/usuario/servos-php`.
2. Publique o conteudo de `public/` dentro de `public_html` ou aponte o dominio para a pasta `public`.
3. Ajuste o `index.php` publicado para usar os caminhos corretos caso o host nao permita apontar diretamente para `public/`.
4. Configure permissoes de escrita para `storage/` e `bootstrap/cache/`.
5. Rode `php artisan config:cache` e `php artisan route:cache` no servidor.

## Estrutura importante

- `app/Http/Controllers` -> auth, dashboard e modulos principais
- `app/Models` -> dominio principal do Servos
- `database/seeders/ServosDemoSeeder.php` -> dados iniciais
- `resources/views` -> telas Blade
- `public/css/app.css` -> estilo estatico para deploy simples

## Proximo passo natural

Os proximos modulos para continuar o porte sao:

1. criacao/edicao real de ministerios, membros e escalas
2. pagina de detalhes por ministerio e escala
3. notificacoes e mensagens
4. redefinicao de senha e convites
