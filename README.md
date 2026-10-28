# Pós-Graduação em Pediatria - Plataforma Web

Aplicação web estática, minimalista e autossuficiente para estudo offline da Pós-Graduação em Pediatria (CENBRAP).

---

## 📁 Estrutura de Arquivos

```
├── index.html                  # Interface principal da aplicação
├── styles.css                  # Estilos (Design System, Dark/Light mode)
├── app.js                      # Lógica do player, quizzes, filtros e anotações
├── course-data.js              # Base de dados (145 aulas + 361 questões)
├── videos/                     # Repositório de vídeos locais (145 arquivos em 720p)
│   ├── modulo_introdutoria/
│   ├── modulo_bonus/
│   ├── modulo_01/
│   ├── ...
│   └── modulo_18/
├── estrutura_pediatria.json    # Estrutura completa em JSON
├── estrutura_pediatria.md      # Ementa e grade curricular em Markdown
└── README.md                   # Esta documentação
```

---

## 🚀 Como Executar em Qualquer Ambiente

Esta é uma aplicação **100% estática (frontend puro)**. Todos os caminhos de arquivos e vídeos são **relativos** (`videos/modulo_XX/arquivo.mp4`), o que permite hospedá-la e executá-la em qualquer servidor ou sistema operacional (Linux, Windows, macOS, Docker, Netlify, Vercel, S3, Apache, Nginx, etc.).

### 1. Executando Localmente com Servidor HTTP (Recomendado)

Abra o terminal na pasta do projeto e use qualquer uma das opções abaixo:

**Com Python 3:**
```bash
python -m http.server 8080
```
Acesse: [http://localhost:8080](http://localhost:8080)

**Com Node.js (npx serve):**
```bash
npx serve .
```

**Com PHP:**
```bash
php -S localhost:8080
```

### 2. Abertura Direta
Você também pode abrir o arquivo `index.html` diretamente em seu navegador (Google Chrome, Firefox, Edge, Safari, Brave).

---

## ☁️ Como Usar Vídeos do Google Drive (Nuvem)

Se você preferir não hospedar os arquivos `.mp4` (13 GB) no mesmo servidor da aplicação web, o player já possui **suporte nativo automático ao Google Drive**:

1. **Suba o vídeo no Google Drive**:
   - Faça o upload do arquivo `.mp4` para o seu Google Drive;
   - Clique com o botão direito no vídeo > **Compartilhar** > mude o acesso geral para **"Qualquer pessoa com o link"**.
   - Copie o link (ex: `https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9/view?usp=sharing`).

2. **Vincule no `course-data.js`**:
   - Abra o arquivo `course-data.js`;
   - Na aula desejada, substitua ou preencha o campo `drive_url` (ou `local_video`) com o link do Drive:
   ```javascript
   {
     "titulo": "Parte 1: ...",
     "drive_url": "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9/view",
     "local_video": ""
   }
   ```
   - O player da aplicação web detectará automaticamente o link e exibirá o vídeo embutido em tela cheia via `iframe` com controles nativos de qualidade e velocidade do Google Drive.

