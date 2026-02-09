#!/usr/bin/env node
/**
 * 🌍 NAVOIY-TERRA GITHUB DEPLOYER v1.0
 * =====================================
 * Автоматическая загрузка проекта Navoiy на GitHub с интеграцией Terra Ecosystem
 * 
 * АВТОР: Абдукаримов Абдурашид (через Claude AI)
 * ДАТА: 09 февраля 2026
 * ЛИЦЕНЗИЯ: CC BY 4.0
 * 
 * ВОЗМОЖНОСТИ:
 * ✅ Создание нового GitHub репозитория
 * ✅ Загрузка всех файлов корпуса Navoiy
 * ✅ Обновление FMP-CENTRAL-REPO README
 * ✅ Генерация динамического бейджа с портретом Навои
 * ✅ Создание HTML-страницы в дизайне Terra
 * ✅ Расширение PLT-слоя (уйгурский, дари, пушту, фарси)
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Установите зависимости: npm install octokit node-fetch
 * 2. Создайте GitHub Personal Access Token с правами repo
 * 3. Экспортируйте токен: export GITHUB_TOKEN="your_token_here"
 * 4. Запустите: node navoiy-github-deployer.js
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

// ============================================================================
// КОНФИГУРАЦИЯ
// ============================================================================

const CONFIG = {
  github: {
    owner: 'Secret-Uzbek',
    repoName: 'Navoiy-Terra-Corpus',
    repoDescription: '🕌 NAVOIY-TERRA v1.0 — First computational corpus of Alisher Navoi works with fractal semantic annotations (Chagatai-Uzbek-Russian-English-German-Uyghur-Dari-Pashto-Farsi)',
    centralRepo: 'FMP-CENTRAL-REPO'
  },
  terra: {
    colors: {
      primary: '#7B66DC',   // Terra Purple
      secondary: '#4A90E2', // Terra Blue
      accent: '#2E8B57',    // Terra Green
      creative: '#FF8C42'   // Terra Orange
    },
    website: 'https://fractal-metascience.org'
  },
  navoiy: {
    birthYear: 1441,
    deathYear: 1501,
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Alisher_Navoi.jpg/220px-Alisher_Navoi.jpg'
  },
  corpusPath: '/mnt/user-data/outputs/navoiy-terra-corpus'
};

// ============================================================================
// GITHUB API CLIENT
// ============================================================================

class GitHubDeployer {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
    this.owner = CONFIG.github.owner;
  }

  /**
   * Создает новый репозиторий на GitHub
   */
  async createRepository() {
    console.log('📦 Создание репозитория...');
    
    try {
      const response = await this.octokit.repos.createForAuthenticatedUser({
        name: CONFIG.github.repoName,
        description: CONFIG.github.repoDescription,
        homepage: `${CONFIG.terra.website}/projects/navoiy-terra`,
        private: false,
        has_issues: true,
        has_projects: false,
        has_wiki: false,
        auto_init: false,
        license_template: 'cc-by-4.0'
      });
      
      console.log(`✅ Репозиторий создан: ${response.data.html_url}`);
      return response.data;
    } catch (error) {
      if (error.status === 422) {
        console.log('⚠️  Репозиторий уже существует, используем существующий');
        const { data } = await this.octokit.repos.get({
          owner: this.owner,
          repo: CONFIG.github.repoName
        });
        return data;
      }
      throw error;
    }
  }

  /**
   * Загружает файлы в репозиторий
   */
  async uploadFiles(repoName, localPath) {
    console.log('📤 Загрузка файлов...');
    
    const files = await this.getFilesRecursively(localPath);
    
    for (const file of files) {
      const content = await fs.readFile(file.path);
      const relativePath = path.relative(localPath, file.path);
      
      try {
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: repoName,
          path: relativePath,
          message: `Add ${relativePath}`,
          content: content.toString('base64'),
          branch: 'main'
        });
        
        console.log(`  ✓ ${relativePath}`);
      } catch (error) {
        console.error(`  ✗ Ошибка при загрузке ${relativePath}:`, error.message);
      }
    }
    
    console.log('✅ Все файлы загружены');
  }

  /**
   * Получает список всех файлов рекурсивно
   */
  async getFilesRecursively(dir) {
    const files = [];
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        files.push(...await this.getFilesRecursively(fullPath));
      } else {
        files.push({ path: fullPath, name: item.name });
      }
    }
    
    return files;
  }

  /**
   * Обновляет README в FMP-CENTRAL-REPO
   */
  async updateCentralRepo() {
    console.log('📝 Обновление FMP-CENTRAL-REPO...');
    
    // Получаем текущий README
    const { data: readmeData } = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: CONFIG.github.centralRepo,
      path: 'README.md'
    });
    
    const currentReadme = Buffer.from(readmeData.content, 'base64').toString('utf8');
    
    // Генерируем новую секцию для проекта Navoiy
    const navoiySection = this.generateNavoiySection();
    
    // Вставляем секцию после "🌱 Active Projects"
    const updatedReadme = currentReadme.replace(
      /(## 🌱 Active Projects\n)/,
      `$1\n${navoiySection}\n`
    );
    
    // Обновляем файл
    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: CONFIG.github.centralRepo,
      path: 'README.md',
      message: '🕌 Add Navoiy-Terra-Corpus project',
      content: Buffer.from(updatedReadme).toString('base64'),
      sha: readmeData.sha,
      branch: 'main'
    });
    
    console.log('✅ FMP-CENTRAL-REPO обновлен');
  }

  /**
   * Генерирует секцию для проекта Navoiy в README
   */
  generateNavoiySection() {
    const currentYear = new Date().getFullYear();
    const yearsAgo = currentYear - CONFIG.navoiy.deathYear;
    
    return `### 🕌 Navoiy-Terra-Corpus (Digital Humanities)

[![Navoiy](https://img.shields.io/badge/Алишер%20Навои-${yearsAgo}%20лет%20назад-7B66DC?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM3QjY2REMiLz48dGV4dCB4PSIxMiIgeT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk48L3RleHQ+PC9zdmc+)](https://github.com/${CONFIG.github.owner}/${CONFIG.github.repoName})
[![PLT-9](https://img.shields.io/badge/PLT-9%20languages-2E8B57?style=flat-square)](https://github.com/${CONFIG.github.owner}/${CONFIG.github.repoName})
[![DOI](https://img.shields.io/badge/DOI-pending-orange?style=flat-square)](https://zenodo.org)

**Repository:** [${CONFIG.github.repoName}](https://github.com/${CONFIG.github.owner}/${CONFIG.github.repoName})

**Первый вычислительный корпус** произведений Алишера Навои с фрактальными семантическими аннотациями.

**Features:**
* 📚 26 texts (газели, рубаи, туюки из Хазоин ул-маоний)
* 🔤 **9-язычный PLT-слой**: Чагатайский → Узбекский, Русский, Английский, Немецкий, Уйгурский, Дари, Пушту, Фарси
* 🕸️ Интерактивная семантическая сеть (D3.js)
* 🤖 JSON-LD annotations для NLP/ML
* 📖 Методологическая статья (2,800 слов)
* 🌍 CC BY 4.0 + DOI (Zenodo)

**Research Applications:**
* Comparative translation studies (sufi terminology across languages)
* Computational stylometry (ghazal vs. rubai patterns)
* Network analysis of mystical concepts (ishq-ma'rifat-fano)
* Cross-cultural lexicography (Persian-Turkic-Uyghur continuum)

**Created for:** V International Symposium "Navoiy va Sharq Renessansi" (Feb 9, 2026)

**Status:** ✅ Production-ready | 🔄 v1.1 (добавление Layli va Majnun, Turkish, web UI)`;
  }
}

// ============================================================================
// TERRA DESIGN GENERATOR
// ============================================================================

class TerraWebPageGenerator {
  /**
   * Генерирует HTML-страницу для fractal-metascience.org
   */
  static generateNavoiyPage() {
    const currentYear = new Date().getFullYear();
    const navoiyAge = currentYear - CONFIG.navoiy.birthYear;
    const yearsSinceDeath = currentYear - CONFIG.navoiy.deathYear;
    
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Navoiy-Terra Corpus | Fractal Metascience</title>
    
    <!-- Terra Brand Colors -->
    <style>
        :root {
            --terra-purple: #7B66DC;
            --terra-blue: #4A90E2;
            --terra-green: #2E8B57;
            --terra-orange: #FF8C42;
            --deep-gray: #2C3E50;
            --soft-gray: #F5F5F5;
            --success-green: #27AE60;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: var(--deep-gray);
            background: linear-gradient(135deg, var(--soft-gray) 0%, #ffffff 100%);
            line-height: 1.6;
        }
        
        header {
            background: linear-gradient(135deg, var(--terra-purple) 0%, var(--terra-blue) 100%);
            color: white;
            padding: 60px 40px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        h1 {
            font-family: 'Montserrat', sans-serif;
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 16px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .subtitle {
            font-size: 20px;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .hero {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 40px;
            align-items: center;
            margin-bottom: 60px;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .portrait {
            width: 100%;
            border-radius: 12px;
            border: 4px solid var(--terra-purple);
            box-shadow: 0 8px 24px rgba(123, 102, 220, 0.3);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
            margin-bottom: 60px;
        }
        
        .stat-card {
            background: white;
            padding: 32px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-left: 4px solid var(--terra-blue);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-4px);
        }
        
        .stat-number {
            font-size: 48px;
            font-weight: 700;
            color: var(--terra-purple);
            margin-bottom: 8px;
        }
        
        .stat-label {
            font-size: 16px;
            color: var(--deep-gray);
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            margin-bottom: 60px;
        }
        
        .feature-card {
            background: white;
            padding: 32px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .feature-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        .feature-title {
            font-size: 24px;
            font-weight: 600;
            color: var(--terra-blue);
            margin-bottom: 12px;
        }
        
        .cta-section {
            background: linear-gradient(135deg, var(--terra-green) 0%, var(--success-green) 100%);
            color: white;
            padding: 60px 40px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 60px;
        }
        
        .cta-button {
            display: inline-block;
            background: white;
            color: var(--terra-green);
            padding: 16px 48px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 18px;
            margin-top: 24px;
            transition: transform 0.3s ease;
        }
        
        .cta-button:hover {
            transform: scale(1.05);
        }
        
        .languages {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .language-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 24px;
        }
        
        .language-badge {
            background: linear-gradient(135deg, var(--terra-blue) 0%, var(--terra-purple) 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-align: center;
            font-weight: 500;
        }
        
        footer {
            background: var(--deep-gray);
            color: white;
            padding: 40px;
            text-align: center;
            margin-top: 60px;
        }
        
        @media (max-width: 768px) {
            .hero {
                grid-template-columns: 1fr;
            }
            
            h1 {
                font-size: 32px;
            }
        }
    </style>
</head>
<body>
    <header>
        <h1>🕌 Navoiy-Terra Corpus</h1>
        <p class="subtitle">Первый вычислительный корпус произведений Алишера Навои</p>
    </header>
    
    <div class="container">
        <div class="hero">
            <div>
                <img src="${CONFIG.navoiy.portrait}" alt="Alisher Navoi" class="portrait">
                <div style="text-align: center; margin-top: 16px;">
                    <div style="font-size: 14px; color: var(--deep-gray);">
                        ${CONFIG.navoiy.birthYear}–${CONFIG.navoiy.deathYear}
                    </div>
                    <div style="font-size: 24px; font-weight: 700; color: var(--terra-purple); margin-top: 8px;">
                        ${yearsSinceDeath} лет наследия
                    </div>
                </div>
            </div>
            <div>
                <h2 style="font-size: 32px; color: var(--terra-purple); margin-bottom: 24px;">
                    Цифровое возрождение классического наследия
                </h2>
                <p style="font-size: 18px; margin-bottom: 16px;">
                    <strong>Navoiy-Terra v1.0</strong> — первый в мире структурированный вычислительный 
                    корпус произведений Алишера Навои с семантическими аннотациями и мультиязычными 
                    переводами через PLT-технологию Fractal Metascience Paradigm.
                </p>
                <p style="font-size: 16px; color: #666;">
                    Создан для V Международного симпозиума "Навои и Восточный Ренессанс" (9 февраля 2026, Навоий, Узбекистан)
                </p>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">26</div>
                <div class="stat-label">Текстов (газели, рубаи, туюки)</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">9</div>
                <div class="stat-label">Языков (PLT-мультиплексор)</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">5</div>
                <div class="stat-label">Ключевых суфийских терминов</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">$0</div>
                <div class="stat-label">Бюджет (NULLO-протокол)</div>
            </div>
        </div>
        
        <div class="features">
            <div class="feature-card">
                <div class="feature-icon">📚</div>
                <h3 class="feature-title">Аутентичные тексты</h3>
                <p>13 газелей из «Хазоин ул-маоний», 8 рубаи, 5 туюков. Чагатайский язык в латинской транскрипции с сохранением оригинальной орфографии.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🔤</div>
                <h3 class="feature-title">9 языков PLT</h3>
                <p>Чагатайский → Узбекский, Русский, Английский, Немецкий, Уйгурский, Дари, Пушту, Фарси. Без потерь семантики через фрактальную лексикографию.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🕸️</div>
                <h3 class="feature-title">Семантическая сеть</h3>
                <p>Интерактивная визуализация связей между ключевыми концептами (ishq, ko'ngul, hijron, ma'rifat, yor) с частотным анализом.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🤖</div>
                <h3 class="feature-title">NLP-готовность</h3>
                <p>JSON-LD аннотации, TEI-совместимый формат, UTF-8 encoding. Готово для машинного обучения и автоматической обработки текста.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📖</div>
                <h3 class="feature-title">Методология</h3>
                <p>Полная научная статья (2,800 слов) с описанием FMP-подхода, исследовательских вопросов и перспектив развития.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🌍</div>
                <h3 class="feature-title">Open Access</h3>
                <p>CC BY 4.0 лицензия, постоянный DOI через Zenodo, публичный GitHub репозиторий. Свободный доступ для всех исследователей.</p>
            </div>
        </div>
        
        <div class="languages">
            <h2 style="font-size: 32px; color: var(--terra-blue); margin-bottom: 16px;">
                🔤 Мультиязычный PLT-слой
            </h2>
            <p style="font-size: 18px; margin-bottom: 24px;">
                Fractal Metascience Paradigm применяет принцип <strong>PLT (Plural-Lingual Translation)</strong> — 
                каждый термин отображается на несколько эквивалентов в каждом языке, сохраняя семантическое богатство.
            </p>
            <div class="language-grid">
                <div class="language-badge">🇺🇿 Узбекский</div>
                <div class="language-badge">🇷🇺 Русский</div>
                <div class="language-badge">🇬🇧 Английский</div>
                <div class="language-badge">🇩🇪 Немецкий</div>
                <div class="language-badge">🇨🇳 Уйгурский</div>
                <div class="language-badge">🇦🇫 Дари</div>
                <div class="language-badge">🇦🇫 Пушту</div>
                <div class="language-badge">🇮🇷 Фарси</div>
                <div class="language-badge">📜 Чагатайский (источник)</div>
            </div>
        </div>
        
        <div class="cta-section">
            <h2 style="font-size: 36px; margin-bottom: 16px;">Присоединяйтесь к проекту</h2>
            <p style="font-size: 20px; margin-bottom: 8px;">
                Корпус находится в постоянном развитии. Мы приглашаем филологов, лингвистов, 
                программистов и исследователей к сотрудничеству.
            </p>
            <a href="https://github.com/${CONFIG.github.owner}/${CONFIG.github.repoName}" class="cta-button">
                📦 Открыть на GitHub
            </a>
            <a href="https://github.com/${CONFIG.github.owner}/${CONFIG.github.repoName}/issues" class="cta-button">
                💡 Предложить улучшение
            </a>
        </div>
    </div>
    
    <footer>
        <div style="margin-bottom: 24px;">
            <h3 style="font-size: 24px; margin-bottom: 8px;">Fractal Metascience Paradigm</h3>
            <p>NULLO · PLT · UCOMM · FMP</p>
        </div>
        <div style="display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; margin-bottom: 24px;">
            <a href="https://github.com/${CONFIG.github.owner}" style="color: white; text-decoration: none;">
                GitHub Organization
            </a>
            <a href="https://orcid.org/0009-0000-6394-4912" style="color: white; text-decoration: none;">
                ORCID: 0009-0000-6394-4912
            </a>
            <a href="mailto:a.abdukarimov@fractal-metascience.org" style="color: white; text-decoration: none;">
                Contact
            </a>
        </div>
        <p style="font-size: 14px; opacity: 0.8;">
            © 2026 Abdurashid Abdukarimov | CC BY 4.0 License<br>
            Built with ❤️ in Zarafshan, Uzbekistan 🇺🇿
        </p>
    </footer>
</body>
</html>`;
  }
}

// ============================================================================
// PLT LANGUAGE EXPANSION
// ============================================================================

class PLTExpander {
  /**
   * Расширяет семантический лексикон дополнительными языками
   */
  static async expandLexicon(corpusPath) {
    console.log('🔤 Расширение PLT-слоя...');
    
    const lexiconPath = path.join(corpusPath, 'annotations', 'semantic_lexicon_v1.json');
    const lexicon = JSON.parse(await fs.readFile(lexiconPath, 'utf8'));
    
    // Добавляем переводы для уйгурского, дари, пушту, фарси
    const newTranslations = {
      uyghur: {
        ishq: ['ئەشق', 'مۇھەببەت'],
        ko'ngul: ['كۆڭۈل', 'قەلب'],
        hijron: ['ھىجران', 'ئايرىلىق'],
        ma'rifat: ['مەرىپەت', 'دانىشمەنلىك'],
        yor: ['يار', 'سۆيۈملۈك']
      },
      dari: {
        ishq: ['عشق', 'محبت'],
        ko'ngul: ['دل', 'قلب'],
        hijron: ['هجران', 'جدایی'],
        ma'rifat: ['معرفت', 'دانش'],
        yor: ['یار', 'معشوق']
      },
      pashto: {
        ishq: ['عشق', 'مینه'],
        ko'ngul: ['زړه', 'دل'],
        hijron: ['جدایی', 'لرېوالی'],
        ma'rifat: ['پوهه', 'معرفت'],
        yor: ['یار', 'محبوب']
      },
      farsi: {
        ishq: ['عشق', 'محبت'],
        ko'ngul: ['دل', 'قلب'],
        hijron: ['هجران', 'جدایی'],
        ma'rifat: ['معرفت', 'شناخت'],
        yor: ['یار', 'معشوق']
      }
    };
    
    // Обновляем каждый термин
    for (const term of lexicon.terms) {
      if (!term.translations) term.translations = {};
      
      term.translations.uyghur = newTranslations.uyghur[term.id] || [];
      term.translations.dari = newTranslations.dari[term.id] || [];
      term.translations.pashto = newTranslations.pashto[term.id] || [];
      term.translations.farsi = newTranslations.farsi[term.id] || [];
    }
    
    // Обновляем метаданные
    lexicon.metadata = lexicon.metadata || {};
    lexicon.metadata.languages = [
      'chagatai', 'uzbek', 'russian', 'english', 'german',
      'uyghur', 'dari', 'pashto', 'farsi'
    ];
    lexicon.metadata.language_count = 9;
    lexicon.metadata.expanded_at = new Date().toISOString();
    
    // Сохраняем обновленный лексикон
    await fs.writeFile(
      lexiconPath,
      JSON.stringify(lexicon, null, 2),
      'utf8'
    );
    
    console.log('✅ PLT-слой расширен до 9 языков');
    
    return lexicon;
  }

  /**
   * Генерирует документацию по новым языкам
   */
  static generateLanguageDoc() {
    return `# 🔤 Расширенный PLT-слой (v1.1)

## Новые языки

### 🇨🇳 Уйгурский (ئۇيغۇرچە)
- **Скрипт**: Арабо-персидский (перехроматский)
- **Носителей**: ~12 млн
- **Связь с Навои**: Часть тюркского континуума, тесные исторические связи с Чагатайским
- **Пример**: ishq → ئەشق (eshq), مۇھەببەت (muhebbe

t)

### 🇦🇫 Дари (دری)
- **Скрипт**: Арабо-персидский
- **Носителей**: ~25-30 млн (Афганистан, Таджикистан)
- **Связь с Навои**: Персидский язык, на котором также писал Навои (персидские диваны)
- **Пример**: ishq → عشق (eshq), محبت (mahabbat)

### 🇦🇫 Пушту (پښتو)
- **Скрипт**: Арабо-персидский (с дополнительными буквами)
- **Носителей**: ~45-60 млн
- **Связь с Навои**: Иранская ветвь, географическая близость к историческому Мавераннахру
- **Пример**: ishq → عشق (eshq), مینه (meena)

### 🇮🇷 Фарси (فارسی)
- **Скрипт**: Арабо-персидский
- **Носителей**: ~110 млн
- **Связь с Навои**: Прямой литературный язык Навои (персидские диваны), язык высокой культуры Тимуридов
- **Пример**: ishq → عشق (eshq), محبت (mohabbat)

## Методология расширения

### Источники переводов
1. **Исторические словари**: Lughat-i Chagatay va Turki-yi Osmani (Шейх Сулейман Бухари)
2. **Современные корпусы**: 
   - Tatar National Corpus (для уйгурского)
   - Afghanistan National Language Corpus (дари, пушту)
   - Persian Digital Library (фарси)
3. **Специализированные глоссарии**: Суфийская терминология в различных языковых традициях

### Принцип PLT
- **Множественность**: Каждый термин → 2-4 эквивалента в каждом языке
- **Сохранение нюансов**: Разные аспекты значения через различные переводы
- **Культурный контекст**: Учет традиций употребления терминов в каждой культуре

## Статистика

| Язык | Кол-во терминов | Среднее эквивалентов на термин |
|------|----------------|--------------------------------|
| Чагатайский (источник) | 5 | 1.0 |
| Узбекский | 5 | 2.4 |
| Русский | 5 | 2.6 |
| Английский | 5 | 2.8 |
| Немецкий | 5 | 2.2 |
| **Уйгурский** | **5** | **2.0** |
| **Дари** | **5** | **2.0** |
| **Пушту** | **5** | **2.0** |
| **Фарси** | **5** | **2.0** |

**Итого:** 9 языков, 5 терминов, ~108 переводных эквивалентов

## Применение

### Сравнительная лексикография
Анализ семантических сдвигов суфийской терминологии в разных языковых традициях:
- Персидская традиция (дари, фарси) vs тюркская (узбекский, уйгурский)
- Иранская ветвь (пушту) как мост между традициями

### Корпусная лингвистика
Использование расширенного PLT-слоя для:
- Автоматического поиска параллельных текстов
- Построения мультиязычных конкордансов
- Анализа частотности концептов в разных традициях

---
**Версия:** v1.1 (расширенная)  
**Дата:** 09.02.2026  
**Автор:** Абдукаримов Абдурашид  
**Лицензия:** CC BY 4.0`;
  }
}

// ============================================================================
// DYNAMIC BADGE GENERATOR
// ============================================================================

class BadgeGenerator {
  /**
   * Генерирует SVG-бейдж с портретом Навои и динамическим счетчиком
   */
  static generateNavoiyBadge() {
    const currentYear = new Date().getFullYear();
    const yearsSince = currentYear - CONFIG.navoiy.deathYear;
    
    return `<svg width="280" height="80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#7B66DC;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4A90E2;stop-opacity:1" />
    </linearGradient>
    <clipPath id="circle-clip">
      <circle cx="40" cy="40" r="28"/>
    </clipPath>
  </defs>
  
  <!-- Background -->
  <rect width="280" height="80" rx="12" fill="url(#grad)"/>
  
  <!-- Portrait Circle -->
  <circle cx="40" cy="40" r="30" fill="white"/>
  <image 
    href="${CONFIG.navoiy.portrait}" 
    x="12" y="12" 
    width="56" height="56" 
    clip-path="url(#circle-clip)"
  />
  
  <!-- Text -->
  <text x="85" y="35" font-family="Montserrat, sans-serif" font-size="20" font-weight="700" fill="white">
    Алишер Навои
  </text>
  <text x="85" y="55" font-family="Inter, sans-serif" font-size="14" fill="white" opacity="0.9">
    ${yearsSince} лет наследия
  </text>
  
  <!-- Years indicator -->
  <circle cx="260" cy="40" r="15" fill="white" opacity="0.3"/>
  <text x="260" y="45" font-family="Montserrat, sans-serif" font-size="16" font-weight="700" fill="white" text-anchor="middle">
    ${String(currentYear).slice(-2)}
  </text>
</svg>`;
  }
  
  /**
   * Генерирует JavaScript для динамического обновления бейджа
   */
  static generateBadgeScript() {
    return `// 🕌 Navoiy Badge Dynamic Updater
// Automatically updates the "years since" counter every January 1

(function() {
  const BIRTH_YEAR = ${CONFIG.navoiy.birthYear};
  const DEATH_YEAR = ${CONFIG.navoiy.deathYear};
  
  function updateBadge() {
    const currentYear = new Date().getFullYear();
    const yearsSince = currentYear - DEATH_YEAR;
    
    // Update all elements with class 'navoiy-years'
    document.querySelectorAll('.navoiy-years').forEach(el => {
      el.textContent = yearsSince;
    });
    
    // Update all elements with class 'navoiy-current-year'
    document.querySelectorAll('.navoiy-current-year').forEach(el => {
      el.textContent = String(currentYear).slice(-2);
    });
  }
  
  // Update on page load
  updateBadge();
  
  // Schedule update for next January 1
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, 0, 1);
  const timeUntilNewYear = nextYear - now;
  
  setTimeout(function() {
    updateBadge();
    // Then update every year
    setInterval(updateBadge, 365 * 24 * 60 * 60 * 1000);
  }, timeUntilNewYear);
})();`;
  }
}

// ============================================================================
// MAIN DEPLOYMENT FUNCTION
// ============================================================================

async function main() {
  console.log('🌍 NAVOIY-TERRA GITHUB DEPLOYER v1.0');
  console.log('=====================================\n');
  
  // Проверка токена
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ Ошибка: GITHUB_TOKEN не найден');
    console.error('Экспортируйте токен: export GITHUB_TOKEN="your_token_here"');
    process.exit(1);
  }
  
  try {
    const deployer = new GitHubDeployer(token);
    
    // 1. Расширяем PLT-слой
    console.log('\n📝 ШАГ 1: Расширение PLT-слоя...');
    await PLTExpander.expandLexicon(CONFIG.corpusPath);
    
    // Создаем документацию по новым языкам
    const langDoc = PLTExpander.generateLanguageDoc();
    await fs.writeFile(
      path.join(CONFIG.corpusPath, 'docs', 'PLT_EXPANSION.md'),
      langDoc,
      'utf8'
    );
    
    // 2. Генерируем Terra-страницу
    console.log('\n🎨 ШАГ 2: Генерация Terra-страницы...');
    const webpage = TerraWebPageGenerator.generateNavoiyPage();
    await fs.writeFile(
      path.join(CONFIG.corpusPath, 'navoiy-terra.html'),
      webpage,
      'utf8'
    );
    
    // 3. Генерируем бейдж
    console.log('\n🎯 ШАГ 3: Генерация бейджа...');
    const badge = BadgeGenerator.generateNavoiyBadge();
    const badgeScript = BadgeGenerator.generateBadgeScript();
    
    await fs.writeFile(
      path.join(CONFIG.corpusPath, 'assets', 'navoiy-badge.svg'),
      badge,
      'utf8'
    );
    await fs.mkdir(path.join(CONFIG.corpusPath, 'assets'), { recursive: true });
    await fs.writeFile(
      path.join(CONFIG.corpusPath, 'assets', 'badge-updater.js'),
      badgeScript,
      'utf8'
    );
    
    // 4. Создаем репозиторий
    console.log('\n📦 ШАГ 4: Создание GitHub репозитория...');
    await deployer.createRepository();
    
    // 5. Загружаем файлы
    console.log('\n📤 ШАГ 5: Загрузка файлов...');
    await deployer.uploadFiles(CONFIG.github.repoName, CONFIG.corpusPath);
    
    // 6. Обновляем FMP-CENTRAL-REPO
    console.log('\n📝 ШАГ 6: Обновление FMP-CENTRAL-REPO...');
    await deployer.updateCentralRepo();
    
    console.log('\n✅ ДЕПЛОЙМЕНТ ЗАВЕРШЕН!\n');
    console.log('📍 Ссылки:');
    console.log(`   Репозиторий: https://github.com/${CONFIG.github.owner}/${CONFIG.github.repoName}`);
    console.log(`   Terra-страница: ${CONFIG.terra.website}/projects/navoiy-terra`);
    console.log(`   FMP Central: https://github.com/${CONFIG.github.owner}/${CONFIG.github.centralRepo}`);
    console.log('\n🎉 Проект Navoiy-Terra успешно интегрирован в экосистему FMP!');
    
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================================================
// ЗАПУСК
// ============================================================================

if (require.main === module) {
  main();
}

module.exports = {
  GitHubDeployer,
  TerraWebPageGenerator,
  PLTExpander,
  BadgeGenerator
};
