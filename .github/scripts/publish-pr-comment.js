#!/usr/bin/env node

/**
 * Script pour publier le commentaire de rapport dans la Pull Request
 * Usage: node publish-pr-comment.js
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Lire le rapport
const report = fs.readFileSync('pr_report.md', 'utf8');

// Fonction pour exécuter les commandes GitHub CLI
function execGitHubCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Erreur lors de l'exécution: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Fonction pour lister les commentaires
function listComments() {
  const command = `gh api repos/${process.env.GITHUB_REPOSITORY}/issues/${process.env.GITHUB_EVENT_NUMBER}/comments`;
  return JSON.parse(execGitHubCommand(command));
}

// Fonction pour créer un commentaire
function createComment(body) {
  const command = `gh api repos/${process.env.GITHUB_REPOSITORY}/issues/${process.env.GITHUB_EVENT_NUMBER}/comments --method POST --field body='${body.replace(/'/g, "\\'")}'`;
  execGitHubCommand(command);
}

// Fonction pour mettre à jour un commentaire
function updateComment(commentId, body) {
  const command = `gh api repos/${process.env.GITHUB_REPOSITORY}/issues/comments/${commentId} --method PATCH --field body='${body.replace(/'/g, "\\'")}'`;
  execGitHubCommand(command);
}

// Fonction principale
async function main() {
  try {
    console.log('🔍 Recherche des commentaires existants...');
    
    // Lister les commentaires
    const comments = listComments();
    
    // Rechercher un commentaire existant du bot
    const botComment = comments.find(comment => 
      comment.user.type === 'Bot' && 
      comment.body.includes('Rapport de Build - Frontend Angular')
    );
    
    if (botComment) {
      console.log('📝 Mise à jour du commentaire existant...');
      updateComment(botComment.id, report);
      console.log('✅ Commentaire mis à jour avec succès');
    } else {
      console.log('➕ Création d\'un nouveau commentaire...');
      createComment(report);
      console.log('✅ Commentaire créé avec succès');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la publication du commentaire:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
main();
