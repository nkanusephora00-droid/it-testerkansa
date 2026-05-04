# 🧪 IT-TesterKansa - Plateforme de Gestion de Tests QA

## 🎯 Vision Métier

IT-TesterKansa est une plateforme professionnelle de **Quality Assurance Testing** conçue pour les équipes de développement et de test. Elle permet de gérer efficacement les campagnes de tests, de collaborer entre testeurs et de générer des rapports détaillés.

### 🚀 Fonctionnalités Principales

- **📋 Gestion des Sessions de Tests** : Créez et organisez des campagnes de tests par application
- **✅ Cas de Tests Complets** : Créez des tests détaillés avec préconditions, étapes et résultats attendus
- **📊 Rapports PDF** : Générez des rapports professionnels prêts à être partagés
- **👥 Collaboration** : Travaillez en équipe sur les sessions de tests
- **📱 Interface Responsive** : Accédez à la plateforme depuis n'importe quel appareil

## 🏗️ Architecture Technique

### Stack Moderne
- **Frontend** : React 19 + TypeScript + Sass
- **Backend** : API REST Java (déployée sur Render)
- **Authentification** : JWT Token-based
- **Styling** : CSS Modules + Variables CSS
- **Icons** : FontAwesome Pro

### Architecture Clean Code
```
src/
├── domain/           # Business Logic & Entities
│   ├── entities/     # TypeScript Interfaces
│   └── usecases/     # Business Rules
├── infrastructure/  # Data Access Layer
│   └── api/          # API Clients
├── presentation/     # UI Components
│   ├── components/   # Reusable Components
│   └── pages/        # Page Components
├── shared/          # Cross-cutting Concerns
│   ├── types/        # Shared Types
│   └── utils/        # Helper Functions
└── hooks/           # Custom React Hooks
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 16+
- npm ou yarn

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd it-testerkansa-main
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Démarrer le développement**
```bash
npm start
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

### Variables d'Environnement

Créez un fichier `.env` à la racine :
```env
REACT_APP_API_URL=https://votre-backend-api.com
```

## 📱 Utilisation

### Workflow de Test Typique

1. **Créer une Session**
   - Allez dans la section "Tests"
   - Cliquez sur "Nouvelle Session"
   - Remplissez les informations (nom, application, description)

2. **Ajouter des Cas de Tests**
   - Sélectionnez la session créée
   - Cliquez sur "Voir" pour entrer dans la session
   - Ajoutez des tests avec fonction, préconditions, étapes, etc.

3. **Exécuter les Tests**
   - Modifiez les statuts (OK, BUG, EN COURS, BLOQUE)
   - Ajoutez des captures d'écran si nécessaire
   - Commentez les résultats

4. **Générer un Rapport**
   - Cliquez sur "Exporter" pour générer un PDF
   - Partagez le rapport avec l'équipe

### Interface Utilisateur

- **🏠 Dashboard** : Vue d'ensemble des sessions et statistiques
- **📋 Tests** : Gestion des sessions et cas de tests
- **👥 Utilisateurs** : Administration des comptes (admin)
- **⚙️ Applications** : Gestion des applications testées
- **📊 Rapports** : Historique et exports

## 🔧 Scripts Disponibles

### `npm start`
Démarre l'application en mode développement avec hot-reload.

### `npm run build`
Crée une version optimisée pour la production dans le dossier `build/`.

### `npm test`
Lance les tests unitaires en mode watch.

### `npm run eject`
**Attention : Opération irréversible !** 
Expose toutes les configurations de build (webpack, babel, etc.).

## 🎨 Personnalisation

### Thèmes et Styles
L'application utilise des variables CSS personnalisées pour faciliter la personnalisation :

```css
:root {
  --primary-color: #3498db;
  --bg-primary: #f8f9fa;
  --text-primary: #2c3e50;
  /* ... */
}
```

### Composants Réutilisables
Les composants sont conçus pour être réutilisables et typés avec TypeScript :

```typescript
interface SessionFormProps {
  onSubmit: (data: CreateTestSessionRequest) => Promise<void>;
  onCancel: () => void;
  mode?: 'modal' | 'inline';
}
```

## 🚀 Déploiement

### Production
```bash
npm run build
# Le dossier build/ contient l'application optimisée
```

### Vercel (Recommandé)
Le projet est configuré pour Vercel avec `vercel.json`.

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribuer

### Normes de Code
- TypeScript strict
- ESLint + Prettier
- CSS Modules pour les styles
- Tests unitaires avec Jest

### Git Workflow
```bash
git checkout -b feature/nouvelle-fonctionnalite
# ... travail ...
git commit -m "feat: ajoute nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite
# Pull request
```

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@it-testerkansa.com
- 📱 Discord : [Serveur Discord]
- 📖 Documentation : [Wiki du projet]

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Développé avec ❤️ par l'équipe IT-TesterKansa**
